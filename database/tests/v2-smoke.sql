-- Version 2 smoke test: provisioning from a template, roll-up, permissions.
-- Runs as a superuser against a disposable database and ends in a forced
-- error, so nothing is ever saved. Read the SMOKE_RESULT line.
--   psql -v ON_ERROR_STOP=0 -f database/tests/v2-smoke.sql
do $$
declare
  A uuid := gen_random_uuid(); O uuid := gen_random_uuid(); C uuid := gen_random_uuid();
  R uuid := gen_random_uuid(); E uuid := gen_random_uuid(); D uuid := gen_random_uuid(); O2 uuid := gen_random_uuid();
  t uuid; t2 uuid; root uuid; mum uuid; pun uuid; b1 uuid; b2 uuid; b3 uuid; k uuid; n int; res text := ''; rid uuid; cat uuid;
  hash_a text := repeat('a', 64); hash_b text := repeat('b', 64); hash_c text := repeat('c', 64); hash_d text := repeat('d', 64);
  hash_e text := repeat('e', 64); hash_f text := repeat('f', 64); hash_0 text := repeat('0', 64);
  v text; flag boolean;
begin
  insert into kpi_control.operators(subject) values (A);

  -- 1. operator provisions from a template, with members and roles ---------
  set local role kpi_control_app;
  perform set_config('kpi.subject', A::text, true);
  t := kpi_control.provision_with_template('Retail Co', 'owner@x.com', hash_a, 'retail-chain',
    jsonb_build_array(
      jsonb_build_object('email','c@x.com','roleKeys',jsonb_build_array('data_contributor'),'tokenHash',hash_b),
      jsonb_build_object('email','r@x.com','roleKeys',jsonb_build_array('data_reviewer'),'tokenHash',hash_c),
      jsonb_build_object('email','e@x.com','roleKeys',jsonb_build_array('executive','finance'),'tokenHash',hash_d)));
  begin
    perform kpi_control.provision_with_template('Bad', 'b@x.com', hash_e, 'retail-chain',
      jsonb_build_array(jsonb_build_object('email','z@x.com','roleKeys',jsonb_build_array('no_such_role'),'tokenHash',hash_f)));
    res := res || 'bad_role=ALLOWED(BUG);';
  exception when sqlstate '22023' then res := res || 'bad_role=blocked;'; end;
  begin
    perform kpi_control.provision_with_template('Bad2', 'b@x.com', hash_e, 'no-such-template', '[]'::jsonb);
    res := res || 'bad_template=ALLOWED(BUG);';
  exception when sqlstate '22023' then res := res || 'bad_template=blocked;'; end;
  begin
    perform kpi_control.provision_with_template('Bad3', 'b@x.com', hash_e, 'retail-chain',
      jsonb_build_array(jsonb_build_object('email','not-an-email','roleKeys',jsonb_build_array('executive'),'tokenHash',hash_f)));
    res := res || 'bad_email=ALLOWED(BUG);';
  exception when sqlstate '22023' then res := res || 'bad_email=blocked;'; end;
  begin
    perform kpi_control.provision_with_template('Bad4', 'b@x.com', hash_e, 'retail-chain',
      jsonb_build_array(jsonb_build_object('email','z@x.com','roleKeys',jsonb_build_array('executive'),'tokenHash','short')));
    res := res || 'bad_token=ALLOWED(BUG);';
  exception when sqlstate '22023' then res := res || 'bad_token=blocked;'; end;
  begin perform 1 from kpi.results limit 1; res := res || 'operator_reads_results=ALLOWED(BUG);';
  exception when insufficient_privilege then res := res || 'operator_reads_results=blocked;'; end;
  begin perform 1 from kpi_catalog.kpis limit 1; res := res || 'operator_reads_catalog=ok;';
  exception when others then res := res || 'operator_reads_catalog=BLOCKED(BUG);'; end;
  -- non-operator cannot provision
  perform set_config('kpi.subject', O::text, true);
  begin perform kpi_control.provision_with_template('Evil', 'e@x.com', hash_e, 'retail-chain', '[]'::jsonb);
    res := res || 'nonoperator_provision=ALLOWED(BUG);';
  exception when sqlstate '42501' then res := res || 'nonoperator_provision=blocked;'; end;
  perform set_config('kpi.subject', A::text, true);
  reset role;

  select count(*) into n from kpi.roles where tenant_id = t;                              res := res || 'roles=' || n || ';';
  select count(*) into n from kpi.definitions where tenant_id = t and state = 'active';   res := res || 'active_kpis=' || n || ';';
  select count(*) into n from kpi.measures where tenant_id = t;                           res := res || 'measures=' || n || ';';
  select count(*) into n from kpi.invitations where tenant_id = t;                        res := res || 'invitations=' || n || ';';

  -- 2. everyone accepts their invitation ------------------------------------
  set local role kpi_app;
  perform set_config('kpi.subject', O::text, true); perform kpi.accept_invitation(hash_a, 'owner@x.com');
  perform set_config('kpi.subject', C::text, true); perform kpi.accept_invitation(hash_b, 'c@x.com');
  perform set_config('kpi.subject', R::text, true); perform kpi.accept_invitation(hash_c, 'r@x.com');
  perform set_config('kpi.subject', E::text, true); perform kpi.accept_invitation(hash_d, 'e@x.com');

  -- 3. owner builds the unit tree ---------------------------------------------
  perform set_config('kpi.subject', O::text, true);
  select id into root from kpi.units where tenant_id = t and parent_id is null;
  insert into kpi.units(tenant_id,name,kind,parent_id) values (t,'Mumbai','Store',root) returning id into mum;
  insert into kpi.units(tenant_id,name,kind,parent_id) values (t,'Pune','Store',root) returning id into pun;

  -- 4. contributor submits for both stores; reviewer approves ---------------
  perform set_config('kpi.subject', C::text, true);
  insert into kpi.batches(tenant_id,unit_id,period_start,period_end,origin,submitted_by,idempotency_key,payload_hash)
   values (t,mum,'2026-09-01','2026-09-30','import',C,gen_random_uuid(),'x') returning id into b1;
  insert into kpi.inputs(tenant_id,batch_id,measure,value) values (t,b1,'revenue',1000),(t,b1,'transactions',50);
  insert into kpi.batches(tenant_id,unit_id,period_start,period_end,origin,submitted_by,idempotency_key,payload_hash)
   values (t,pun,'2026-09-01','2026-09-30','manual',C,gen_random_uuid(),'x') returning id into b2;
  insert into kpi.inputs(tenant_id,batch_id,measure,value) values (t,b2,'revenue',500),(t,b2,'transactions',20);
  begin perform kpi.approve_batch(t, b1); res := res || 'contributor_approves=ALLOWED(BUG);';
  exception when sqlstate '42501' then res := res || 'contributor_approves=blocked;'; end;
  select count(*) into n from kpi.results; res := res || 'contributor_sees_results=' || n || ';';

  perform set_config('kpi.subject', R::text, true);
  perform kpi.approve_batch(t, b1); perform kpi.approve_batch(t, b2);

  -- 5. roll-up: Mumbai + Pune = chain root ---------------------------------
  select value into v from kpi.rollup_inputs(t, mum, root, '2026-09-01', '2026-09-30') where measure = 'revenue';
  res := res || 'rollup_revenue=' || coalesce(round(v::numeric)::text,'none') || ';';
  select value into v from kpi.rollup_inputs(t, mum, root, '2026-09-01', '2026-09-30') where measure = 'transactions';
  res := res || 'rollup_transactions=' || coalesce(round(v::numeric)::text,'none') || ';';
  select value into v from kpi.rollup_inputs(t, mum, mum, '2026-09-01', '2026-09-30') where measure = 'revenue';
  res := res || 'own_revenue=' || coalesce(round(v::numeric)::text,'none') || ';';
  select count(*) into n from kpi.rollup_inputs(t, mum, root, '2026-10-01', '2026-10-31'); res := res || 'rollup_empty_period=' || n || ';';
  begin perform * from kpi.rollup_inputs(t, mum, pun, '2026-09-01', '2026-09-30'); res := res || 'rollup_to_sibling=ALLOWED(BUG);';
  exception when sqlstate '42501' then res := res || 'rollup_to_sibling=blocked;'; end;
  -- a unit's own figure wins over its children
  perform set_config('kpi.subject', C::text, true);
  insert into kpi.batches(tenant_id,unit_id,period_start,period_end,origin,submitted_by,idempotency_key,payload_hash)
   values (t,root,'2026-09-01','2026-09-30','manual',C,gen_random_uuid(),'x') returning id into b3;
  insert into kpi.inputs(tenant_id,batch_id,measure,value) values (t,b3,'revenue',9999);
  perform set_config('kpi.subject', R::text, true);
  perform kpi.approve_batch(t, b3);
  select value into v from kpi.rollup_inputs(t, root, root, '2026-09-01', '2026-09-30') where measure = 'revenue';
  res := res || 'root_own_wins=' || coalesce(round(v::numeric)::text,'none') || ';';
  select value into v from kpi.rollup_inputs(t, root, root, '2026-09-01', '2026-09-30') where measure = 'transactions';
  res := res || 'root_transactions_from_children=' || coalesce(round(v::numeric)::text,'none') || ';';

  -- 6. publish a result at the parent unit; visibility by role ---------------
  select id into k from kpi.definitions where tenant_id = t and catalog_id = 'RTL-003';
  perform kpi.publish_result(t, mum, root, k, '2026-09-01', '2026-09-30', '{"status":"available","value":"30"}'::jsonb,
     '{}'::uuid[], '{import}'::text[], null, 'higher', null, gen_random_uuid());
  begin perform kpi.publish_result(t, mum, pun, k, '2026-09-01', '2026-09-30', '{"status":"available","value":"30"}'::jsonb,
     '{}'::uuid[], '{import}'::text[], null, 'higher', null, gen_random_uuid()); res := res || 'publish_to_sibling=ALLOWED(BUG);';
  exception when sqlstate '42501' then res := res || 'publish_to_sibling=blocked;'; end;
  perform set_config('kpi.subject', E::text, true);
  select count(*) into n from kpi.results; res := res || 'executive_sees_results=' || n || ';';
  select count(*) into n from kpi.definitions; res := res || 'executive_sees_kpis=' || n || ';';
  perform set_config('kpi.subject', C::text, true);
  select count(*) into n from kpi.results; res := res || 'contributor_sees_results_after=' || n || ';';
  select count(*) into n from kpi.definitions; res := res || 'contributor_sees_kpis=' || n || ';';
  begin perform kpi.publish_result(t, mum, root, k, '2026-09-01', '2026-09-30', '{"status":"available","value":"1"}'::jsonb,
     '{}'::uuid[], '{import}'::text[], null, 'higher', null, gen_random_uuid()); res := res || 'contributor_publishes=ALLOWED(BUG);';
  exception when sqlstate '42501' then res := res || 'contributor_publishes=blocked;'; end;

  -- 7. owner adds a catalog KPI; others cannot --------------------------------
  perform set_config('kpi.subject', O::text, true);
  cat := kpi.add_catalog_kpi(t, 'FIN-002');
  res := res || 'owner_adds_catalog_kpi=' || (cat is not null) || ';';
  begin perform kpi.add_catalog_kpi(t, 'NOPE-999'); res := res || 'unknown_catalog=ALLOWED(BUG);';
  exception when sqlstate '22023' then res := res || 'unknown_catalog=blocked;'; end;
  perform set_config('kpi.subject', C::text, true);
  begin perform kpi.add_catalog_kpi(t, 'FIN-003'); res := res || 'contributor_adds_catalog_kpi=ALLOWED(BUG);';
  exception when sqlstate '42501' then res := res || 'contributor_adds_catalog_kpi=blocked;'; end;
  reset role;

  -- 7b. targets: only the owner, and stored results follow
  set local role kpi_app;
  perform set_config('kpi.subject', O::text, true);
  perform kpi.set_target(t, k, 20);
  select on_target into flag from kpi.results where tenant_id = t and kpi_id = k limit 1;
  res := res || 'owner_target_20_flags_30_on_target=' || coalesce(flag::text, 'null') || ';';
  perform kpi.set_target(t, k, 50);
  select on_target into flag from kpi.results where tenant_id = t and kpi_id = k limit 1;
  res := res || 'owner_target_50_flags_30_off_target=' || coalesce(flag::text, 'null') || ';';
  perform kpi.set_target(t, k, null);
  select on_target into flag from kpi.results where tenant_id = t and kpi_id = k limit 1;
  res := res || 'cleared_target_flag=' || coalesce(flag::text, 'null') || ';';
  begin update kpi.definitions set formula = '{"op":"constant","value":"1"}' where id = k; res := res || 'edit_formula_after_target=ALLOWED(BUG);';
  exception when others then res := res || 'edit_formula_after_target=blocked;'; end;
  perform set_config('kpi.subject', C::text, true);
  begin perform kpi.set_target(t, k, 1); res := res || 'contributor_sets_target=ALLOWED(BUG);';
  exception when sqlstate '42501' then res := res || 'contributor_sets_target=blocked;'; end;
  reset role;

  -- 8. a second organisation cannot see or touch the first -----------------------
  set local role kpi_control_app; perform set_config('kpi.subject', A::text, true);
  t2 := kpi_control.provision_with_template('Other Co', 'o2@x.com', hash_0, 'general-business', '[]'::jsonb);
  reset role;
  set local role kpi_app; perform set_config('kpi.subject', O2::text, true);
  perform kpi.accept_invitation(hash_0, 'o2@x.com');
  select count(*) into n from kpi.definitions where tenant_id = t; res := res || 'other_org_sees_defs=' || n || ';';
  select count(*) into n from kpi.units where tenant_id = t;       res := res || 'other_org_sees_units=' || n || ';';
  select count(*) into n from kpi.results;                         res := res || 'other_org_sees_results=' || n || ';';
  begin perform * from kpi.rollup_inputs(t, mum, root, '2026-09-01', '2026-09-30'); res := res || 'other_org_rollup=ALLOWED(BUG);';
  exception when sqlstate '42501' then res := res || 'other_org_rollup=blocked;'; end;
  begin perform kpi.add_catalog_kpi(t, 'FIN-003'); res := res || 'other_org_add_kpi=ALLOWED(BUG);';
  exception when sqlstate '42501' then res := res || 'other_org_add_kpi=blocked;'; end;
  begin insert into kpi_catalog.kpis(id,name,description,domain,industries,formula,formula_text,unit,direction,measures)
    values ('ZZZ-001','x','x','x','{}','{}','x','x','higher','{}');
    res := res || 'customer_writes_catalog=ALLOWED(BUG);';
  exception when insufficient_privilege then res := res || 'customer_writes_catalog=blocked;'; end;
  reset role;

  -- 8b. no function is open to everyone; internal ones cannot be called by the API roles
  select count(*) into n from pg_proc p join pg_namespace s on s.oid = p.pronamespace
   where s.nspname in ('kpi','kpi_control','kpi_catalog') and has_function_privilege('public', p.oid, 'execute');
  res := res || 'functions_open_to_public=' || (case when n = 0 then 'none' else n || '(BUG)' end) || ';';
  res := res || 'customer_role_can_apply_template=' || (case when has_function_privilege('kpi_app', 'kpi.apply_template(uuid,text,uuid)', 'execute') then 'ALLOWED(BUG)' else 'blocked' end) || ';';
  res := res || 'control_role_can_call_add_people=' || (case when has_function_privilege('kpi_control_app', 'kpi_control.add_people(uuid,jsonb)', 'execute') then 'ALLOWED(BUG)' else 'blocked' end) || ';';
  res := res || 'control_role_can_call_add_invitations=' || (case when has_function_privilege('kpi_control_app', 'kpi_control.add_invitations(uuid,jsonb)', 'execute') then 'ALLOWED(BUG)' else 'blocked' end) || ';';
  res := res || 'customer_role_keeps_its_functions=' || (has_function_privilege('kpi_app', 'kpi.approve_batch(uuid,uuid)', 'execute') and has_function_privilege('kpi_app', 'kpi.set_target(uuid,uuid,numeric)', 'execute') and has_function_privilege('kpi_control_app', 'kpi_control.provision_with_people(text,text,jsonb)', 'execute')) || ';';

  -- 9. people created with logins (the control API supplies the user ids) ----------
  declare
    u1 uuid := gen_random_uuid(); u2 uuid := gen_random_uuid(); u3 uuid := gen_random_uuid(); t3 uuid; cnt int; rcount int;
  begin
   set local role kpi_control_app;
   perform set_config('kpi.subject', A::text, true);
   t3 := kpi_control.provision_with_people('Logins Co', 'diagnostics-lab', jsonb_build_array(
     jsonb_build_object('email','owner@logins.test','owner',true,'roleKeys','[]'::jsonb,'subject',u1),
     jsonb_build_object('email','ceo@logins.test','roleKeys','["executive"]'::jsonb,'subject',u2)));
   res := res || 'login_org_created=' || (t3 is not null) || ';';
   begin perform kpi_control.provision_with_people('No Owner', 'diagnostics-lab', jsonb_build_array(jsonb_build_object('email','a@x.test','roleKeys','["executive"]'::jsonb,'subject',gen_random_uuid())));
     res := res || 'no_owner=ALLOWED(BUG);'; exception when sqlstate '22023' then res := res || 'no_owner=blocked;'; end;
   begin perform kpi_control.provision_with_people('Two Owners', 'diagnostics-lab', jsonb_build_array(
       jsonb_build_object('email','a@x.test','owner',true,'subject',gen_random_uuid()),
       jsonb_build_object('email','b@x.test','owner',true,'subject',gen_random_uuid())));
     res := res || 'two_owners=ALLOWED(BUG);'; exception when sqlstate '22023' then res := res || 'two_owners=blocked;'; end;
   begin perform kpi_control.provision_with_people('No Template', null, jsonb_build_array(
       jsonb_build_object('email','a@x.test','owner',true,'subject',gen_random_uuid()),
       jsonb_build_object('email','b@x.test','roleKeys','["executive"]'::jsonb,'subject',gen_random_uuid())));
     res := res || 'members_without_template=ALLOWED(BUG);'; exception when sqlstate '22023' then res := res || 'members_without_template=blocked;'; end;
   begin perform kpi_control.provision_with_people('Op Member', 'diagnostics-lab', jsonb_build_array(
       jsonb_build_object('email','a@x.test','owner',true,'subject',gen_random_uuid()),
       jsonb_build_object('email','op@x.test','roleKeys','["executive"]'::jsonb,'subject',A)));
     res := res || 'operator_as_member=ALLOWED(BUG);'; exception when sqlstate '22023' then res := res || 'operator_as_member=blocked;'; end;
   begin perform kpi_control.add_people_to(t3, jsonb_build_array(jsonb_build_object('email','ceo@logins.test','roleKeys','["executive"]'::jsonb,'subject',gen_random_uuid())));
     res := res || 'same_email_twice=ALLOWED(BUG);'; exception when sqlstate '23505' then res := res || 'same_email_twice=blocked;'; end;
   begin perform kpi_control.add_people_to(t3, jsonb_build_array(jsonb_build_object('email','OWNER@logins.test','roleKeys','["executive"]'::jsonb,'tokenHash',hash_a)));
     res := res || 'existing_member_by_invitation=ALLOWED(BUG);'; exception when sqlstate '23505' then res := res || 'existing_member_by_invitation=blocked;'; end;
   begin perform kpi_control.add_people_to(t3, jsonb_build_array(jsonb_build_object('email','x@logins.test','owner',true,'subject',gen_random_uuid())));
     res := res || 'second_owner_later=ALLOWED(BUG);'; exception when sqlstate '22023' then res := res || 'second_owner_later=blocked;'; end;
   begin perform kpi_control.add_people_to(t3, jsonb_build_array(jsonb_build_object('email','y@logins.test','roleKeys','["janitor"]'::jsonb,'subject',gen_random_uuid())));
     res := res || 'unknown_role=ALLOWED(BUG);'; exception when sqlstate '22023' then res := res || 'unknown_role=blocked;'; end;
   begin perform kpi_control.add_people(t3, '[]'::jsonb);
     res := res || 'internal_function_callable=ALLOWED(BUG);'; exception when insufficient_privilege then res := res || 'internal_function_callable=blocked;'; end;
   perform kpi_control.add_people_to(t3, jsonb_build_array(jsonb_build_object('email','later@logins.test','roleKeys','["executive"]'::jsonb,'subject',u3)));
   res := res || 'added_later=true;';
   reset role;

   -- the people really are members, with only their role's view; the operator is not
   select count(*) into rcount from kpi.definitions where tenant_id = t3 and state = 'active';
   set local role kpi_app;
   perform set_config('kpi.subject', u2::text, true);
   select count(*) into cnt from kpi.definitions where tenant_id = t3;
   res := res || 'login_ceo_sees_kpis=' || (cnt > 0 and cnt < rcount) || ';';
   perform set_config('kpi.subject', u1::text, true);
   select count(*) into cnt from kpi.definitions where tenant_id = t3;
   res := res || 'login_owner_sees_all=' || (cnt = rcount) || ';';
   perform set_config('kpi.subject', A::text, true);
   select count(*) into cnt from kpi.organizations where id = t3;
   res := res || 'operator_sees_login_org=' || (case when cnt = 0 then 'blocked' else 'ALLOWED(BUG)' end) || ';';
   reset role;
  end;

  raise exception 'SMOKE_RESULT %', res;
end $$;
