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

  -- 8c. the owner runs the organization; nobody else can, and nothing crosses tenants
  set local role kpi_app;
  perform set_config('kpi.subject', O::text, true);
  perform kpi.rename_organization(t, 'Renamed Co');
  select count(*) into n from kpi.organizations where id = t and name = 'Renamed Co';
  res := res || 'owner_renames=' || (n = 1) || ';';
  rid := kpi.save_role(t, null, 'Smoke role', jsonb_build_array(jsonb_build_object('capability','view','unitId',null,'kpiId',k)));
  res := res || 'owner_saves_role=' || (rid is not null) || ';';
  perform kpi.save_role(t, rid, 'Smoke role 2', '[]'::jsonb);
  select count(*) into n from kpi.grants where tenant_id = t and role_id = rid;
  res := res || 'owner_replaces_grants=' || (n = 0) || ';';
  begin perform kpi.save_role(t, rid, 'X', jsonb_build_array(jsonb_build_object('capability','view','unitId',null,'kpiId',gen_random_uuid())));
    res := res || 'grant_to_unknown_kpi=ALLOWED(BUG);'; exception when foreign_key_violation then res := res || 'grant_to_unknown_kpi=blocked;'; end;
  begin perform kpi.save_role(t, rid, 'X', jsonb_build_array(jsonb_build_object('capability','submit','unitId',null,'kpiId',k)));
    res := res || 'submit_tied_to_kpi=ALLOWED(BUG);'; exception when check_violation then res := res || 'submit_tied_to_kpi=blocked;'; end;
  perform kpi.delete_role(t, rid);
  select count(*) into n from kpi.roles where tenant_id = t and id = rid;
  res := res || 'owner_deletes_unused_role=' || (n = 0) || ';';
  perform set_config('kpi.subject', C::text, true);
  begin perform kpi.rename_organization(t, 'Hijack'); res := res || 'member_renames=ALLOWED(BUG);';
  exception when insufficient_privilege then res := res || 'member_renames=blocked;'; end;
  begin perform kpi.save_role(t, null, 'Hijack', '[]'::jsonb); res := res || 'member_saves_role=ALLOWED(BUG);';
  exception when insufficient_privilege then res := res || 'member_saves_role=blocked;'; end;
  perform set_config('kpi.subject', O2::text, true);
  begin perform kpi.rename_organization(t, 'Other tenant'); res := res || 'other_owner_renames=ALLOWED(BUG);';
  exception when insufficient_privilege then res := res || 'other_owner_renames=blocked;'; end;
  reset role;

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
   -- a person sees their own roles, and only theirs
   perform set_config('kpi.subject', u2::text, true);
   select count(*) into cnt from kpi.my_roles(t3);
   res := res || 'my_roles_executive=' || (cnt = 1 and exists(select 1 from kpi.my_roles(t3) where name ilike 'Executive%')) || ';';
   perform set_config('kpi.subject', u1::text, true);
   select count(*) into cnt from kpi.my_roles(t3);
   res := res || 'my_roles_owner_holds_none=' || (cnt = 0) || ';';
   perform set_config('kpi.subject', gen_random_uuid()::text, true);
   select count(*) into cnt from kpi.my_roles(t3);
   res := res || 'my_roles_stranger=' || (case when cnt = 0 then 'blocked' else 'ALLOWED(BUG)' end) || ';';
   perform set_config('kpi.subject', A::text, true);
   select count(*) into cnt from kpi.my_roles(t3);
   res := res || 'my_roles_operator=' || (case when cnt = 0 then 'blocked' else 'ALLOWED(BUG)' end) || ';';
   select count(*) into cnt from kpi.organizations where id = t3;
   res := res || 'operator_sees_login_org=' || (case when cnt = 0 then 'blocked' else 'ALLOWED(BUG)' end) || ';';
   reset role;
  end;

  -- 10. organization lifecycle: one enforcement point, valid moves only, safe permanent deletion
  declare
    l1 uuid := gen_random_uuid(); l2 uuid := gen_random_uuid(); l3 uuid := gen_random_uuid(); lt uuid; keep uuid; orphans uuid[]; st text; cnt int; rows_before int;
  begin
   set local role kpi_control_app;
   perform set_config('kpi.subject', A::text, true);
   lt := kpi_control.provision_with_people('Lifecycle Co', 'diagnostics-lab', jsonb_build_array(
     jsonb_build_object('email','owner@life.test','owner',true,'subject',l1),
     jsonb_build_object('email','ceo@life.test','roleKeys','["executive"]'::jsonb,'subject',l2)));
   begin perform kpi_control.record_creation(lt, true, 'owner@life.test', false);
     res := res || 'unverified_email_accepted=ALLOWED(BUG);'; exception when sqlstate '22023' then res := res || 'unverified_email_accepted=blocked;'; end;
   perform kpi_control.record_creation(lt, false, 'owner@life.test', true);
   select status into st from kpi_control.list_organizations() where id = lt;
   res := res || 'created_pending=' || (st = 'pending') || ';';
   reset role;

   -- a pending organization admits nobody, not even its owner
   set local role kpi_app;
   perform set_config('kpi.subject', l1::text, true);
   res := res || 'pending_owner_is_owner=' || (case when kpi.is_owner(lt) then 'ALLOWED(BUG)' else 'blocked' end) || ';';
   res := res || 'pending_member_is_member=' || (case when kpi.is_member(lt) then 'ALLOWED(BUG)' else 'blocked' end) || ';';
   select count(*) into cnt from kpi.definitions where tenant_id = lt;
   res := res || 'pending_sees_data=' || (case when cnt = 0 then 'blocked' else 'ALLOWED(BUG)' end) || ';';
   select status into st from kpi.my_organizations() where id = lt;
   res := res || 'pending_owner_sees_status=' || coalesce(st, 'none') || ';';
   begin perform kpi.rename_organization(lt, 'X'); res := res || 'pending_owner_renames=ALLOWED(BUG);';
   exception when insufficient_privilege then res := res || 'pending_owner_renames=blocked;'; end;
   reset role;

   -- only an operator moves an organization, and only along valid paths
   set local role kpi_control_app;
   perform set_config('kpi.subject', l1::text, true);
   begin perform kpi_control.set_org_status(lt, 'active'); res := res || 'owner_activates_self=ALLOWED(BUG);';
   exception when insufficient_privilege then res := res || 'owner_activates_self=blocked;'; end;
   select count(*) into cnt from kpi_control.list_organizations();
   res := res || 'non_operator_lists_orgs=' || (case when cnt = 0 then 'blocked' else 'ALLOWED(BUG)' end) || ';';
   perform set_config('kpi.subject', A::text, true);
   begin perform kpi_control.set_org_status(lt, 'suspended'); res := res || 'pending_to_suspended=ALLOWED(BUG);';
   exception when sqlstate '55000' then res := res || 'pending_to_suspended=blocked;'; end;
   begin perform kpi_control.set_org_status(lt, 'pending'); res := res || 'to_pending=ALLOWED(BUG);';
   exception when sqlstate '22023' then res := res || 'to_pending=blocked;'; end;
   perform kpi_control.set_org_status(lt, 'active');
   reset role;
   set local role kpi_app;
   perform set_config('kpi.subject', l1::text, true);
   res := res || 'active_owner_works=' || kpi.is_owner(lt) || ';';
   reset role;

   -- suspended blocks again, and keeps everything
   select count(*) into rows_before from kpi.definitions where tenant_id = lt;
   set local role kpi_control_app; perform set_config('kpi.subject', A::text, true);
   perform kpi_control.set_org_status(lt, 'suspended');
   reset role;
   set local role kpi_app; perform set_config('kpi.subject', l2::text, true);
   res := res || 'suspended_member_blocked=' || (not kpi.is_member(lt)) || ';';
   reset role;
   select count(*) into cnt from kpi.definitions where tenant_id = lt;
   res := res || 'suspended_keeps_data=' || (cnt = rows_before and cnt > 0) || ';';

   -- delete, restore, and the 30-day rule
   set local role kpi_control_app; perform set_config('kpi.subject', A::text, true);
   perform kpi_control.set_org_status(lt, 'deleted');
   select (purge_after > now() + interval '29 days') into st from kpi_control.list_organizations() where id = lt;
   res := res || 'delete_sets_30_day_window=' || st || ';';
   begin perform kpi_control.purge_organization(lt); res := res || 'purge_early=ALLOWED(BUG);';
   exception when sqlstate '55000' then res := res || 'purge_early=blocked;'; end;
   perform kpi_control.set_org_status(lt, 'suspended');
   select (purge_after is null) into st from kpi_control.list_organizations() where id = lt;
   res := res || 'restore_cancels_deletion=' || st || ';';
   begin perform kpi_control.purge_organization(lt); res := res || 'purge_when_not_deleted=ALLOWED(BUG);';
   exception when sqlstate '55000' then res := res || 'purge_when_not_deleted=blocked;'; end;
   reset role;

   -- permanent deletion: erases this organization, keeps others, returns only logins that belong to nobody else
   keep := (select id from kpi.organizations where id = t limit 1);
   select count(*) into rows_before from kpi.definitions where tenant_id = keep;
   -- l3 is also a member of the first organization, so their login must survive
   reset role; set local role kpi_control_app; perform set_config('kpi.subject', A::text, true);
   perform kpi_control.set_org_status(lt, 'deleted');
   reset role;
   insert into kpi.memberships(tenant_id, subject, display_name, email) values (lt, l3, 'shared', 'shared@life.test');
   insert into kpi.memberships(tenant_id, subject, display_name, email) values (keep, l3, 'shared', 'shared@keep.test');
   update kpi.organizations set purge_after = now() - interval '1 day' where id = lt;
   set local role kpi_control_app; perform set_config('kpi.subject', A::text, true);
   orphans := kpi_control.purge_organization(lt);
   reset role;
   res := res || 'purge_returns_only_orphan_logins=' || (l1 = any(orphans) and l2 = any(orphans) and not (l3 = any(orphans)) and not (A = any(orphans))) || ';';
   select count(*) into cnt from kpi.organizations where id = lt;
   res := res || 'purge_removes_org=' || (cnt = 0) || ';';
   select count(*) into cnt from kpi.definitions where tenant_id = lt;
   select count(*) into rows_before from kpi.definitions where tenant_id = keep;
   res := res || 'purge_removes_its_data=' || (cnt = 0) || ';';
   res := res || 'purge_keeps_other_org=' || (rows_before > 0) || ';';
   select count(*) into cnt from kpi_control.lifecycle where tenant_id = lt and event = 'purged';
   res := res || 'purge_is_logged=' || (cnt = 1) || ';';
  end;

  -- 11. owner-issued logins: the identity role is nearly powerless, and the owner function guards itself
  declare
    i1 uuid := gen_random_uuid(); i2 uuid := gen_random_uuid(); i3 uuid := gen_random_uuid(); it uuid; it2 uuid; exec_role uuid; foreign_role uuid; cnt int; ev int;
  begin
   res := res || 'identity_reads_memberships=' || (case when has_table_privilege('kpi_identity_app','kpi.memberships','select') then 'ALLOWED(BUG)' else 'blocked' end) || ';';
   res := res || 'identity_reads_results=' || (case when has_table_privilege('kpi_identity_app','kpi.results','select') then 'ALLOWED(BUG)' else 'blocked' end) || ';';
   res := res || 'identity_writes_memberships=' || (case when has_table_privilege('kpi_identity_app','kpi.memberships','insert') then 'ALLOWED(BUG)' else 'blocked' end) || ';';
   res := res || 'identity_reads_operator_tables=' || (case when has_table_privilege('kpi_identity_app','kpi_control.registry','select') then 'ALLOWED(BUG)' else 'blocked' end) || ';';
   res := res || 'identity_calls_apply_template=' || (case when has_function_privilege('kpi_identity_app','kpi.apply_template(uuid,text,uuid)','execute') then 'ALLOWED(BUG)' else 'blocked' end) || ';';
   res := res || 'identity_calls_approve=' || (case when has_function_privilege('kpi_identity_app','kpi.approve_batch(uuid,uuid)','execute') then 'ALLOWED(BUG)' else 'blocked' end) || ';';
   res := res || 'identity_calls_add_people=' || (case when has_function_privilege('kpi_identity_app','kpi_control.add_people(uuid,jsonb)','execute') then 'ALLOWED(BUG)' else 'blocked' end) || ';';
   res := res || 'identity_calls_provision=' || (case when has_function_privilege('kpi_identity_app','kpi_control.provision_with_people(text,text,jsonb)','execute') then 'ALLOWED(BUG)' else 'blocked' end) || ';';
   res := res || 'identity_has_its_two_functions=' || (has_function_privilege('kpi_identity_app','kpi.is_owner(uuid)','execute') and has_function_privilege('kpi_identity_app','kpi.add_people_as_owner(uuid,jsonb)','execute')) || ';';
   res := res || 'customer_calls_add_people_as_owner=' || (case when has_function_privilege('kpi_app','kpi.add_people_as_owner(uuid,jsonb)','execute') then 'ALLOWED(BUG)' else 'blocked' end) || ';';

   set local role kpi_control_app; perform set_config('kpi.subject', A::text, true);
   it := kpi_control.provision_with_people('Identity Co', 'diagnostics-lab', jsonb_build_array(
     jsonb_build_object('email','owner@idn.test','owner',true,'subject',i1),
     jsonb_build_object('email','ceo@idn.test','roleKeys','["executive"]'::jsonb,'subject',i2)));
   perform kpi_control.record_creation(it, true, 'owner@idn.test', true);
   it2 := kpi_control.provision_with_people('Identity Other', 'diagnostics-lab', jsonb_build_array(jsonb_build_object('email','o2@idn.test','owner',true,'subject',gen_random_uuid())));
   perform kpi_control.record_creation(it2, true, 'o2@idn.test', true);
   reset role;
   select id into exec_role from kpi.roles where tenant_id = it and template_key = 'executive';
   select id into foreign_role from kpi.roles where tenant_id = it2 limit 1;
   perform 1 from kpi.roles where tenant_id = it2;
   if foreign_role is null then
     insert into kpi.roles(tenant_id,name) values (it2,'Other role') returning id into foreign_role;
   end if;

   set local role kpi_identity_app;
   perform set_config('kpi.subject', i2::text, true);
   begin perform kpi.add_people_as_owner(it, jsonb_build_array(jsonb_build_object('email','x@idn.test','roleIds',jsonb_build_array(exec_role::text),'subject',gen_random_uuid())));
     res := res || 'member_adds_people=ALLOWED(BUG);'; exception when insufficient_privilege then res := res || 'member_adds_people=blocked;'; end;
   perform set_config('kpi.subject', i1::text, true);
   begin perform kpi.add_people_as_owner(it2, jsonb_build_array(jsonb_build_object('email','x@idn.test','roleIds',jsonb_build_array(foreign_role::text),'subject',gen_random_uuid())));
     res := res || 'owner_adds_to_other_org=ALLOWED(BUG);'; exception when insufficient_privilege then res := res || 'owner_adds_to_other_org=blocked;'; end;
   begin perform kpi.add_people_as_owner(it, jsonb_build_array(jsonb_build_object('email','boss@idn.test','owner',true,'roleIds',jsonb_build_array(exec_role::text),'subject',gen_random_uuid())));
     res := res || 'owner_creates_owner=ALLOWED(BUG);'; exception when sqlstate '22023' then res := res || 'owner_creates_owner=blocked;'; end;
   begin perform kpi.add_people_as_owner(it, jsonb_build_array(jsonb_build_object('email','keys@idn.test','roleKeys','["executive"]'::jsonb,'subject',gen_random_uuid())));
     res := res || 'owner_uses_template_keys=ALLOWED(BUG);'; exception when sqlstate '22023' then res := res || 'owner_uses_template_keys=blocked;'; end;
   begin perform kpi.add_people_as_owner(it, jsonb_build_array(jsonb_build_object('email','foreign@idn.test','roleIds',jsonb_build_array(foreign_role::text),'subject',gen_random_uuid())));
     res := res || 'role_from_other_org=ALLOWED(BUG);'; exception when sqlstate '22023' then res := res || 'role_from_other_org=blocked;'; end;
   begin perform kpi.add_people_as_owner(it, jsonb_build_array(jsonb_build_object('email','norole@idn.test','roleIds','[]'::jsonb,'subject',gen_random_uuid())));
     res := res || 'no_role=ALLOWED(BUG);'; exception when sqlstate '22023' then res := res || 'no_role=blocked;'; end;
   begin perform kpi.add_people_as_owner(it, jsonb_build_array(jsonb_build_object('email','op@idn.test','roleIds',jsonb_build_array(exec_role::text),'subject',A)));
     res := res || 'operator_as_member=ALLOWED(BUG);'; exception when sqlstate '22023' then res := res || 'operator_as_member_by_owner=blocked;'; end;
   begin perform kpi.add_people_as_owner(it, (select jsonb_agg(jsonb_build_object('email','p'||g||'@idn.test','roleIds',jsonb_build_array(exec_role::text),'subject',gen_random_uuid())) from generate_series(1,101) g));
     res := res || 'more_than_100=ALLOWED(BUG);'; exception when sqlstate '22023' then res := res || 'more_than_100=blocked;'; end;
   cnt := kpi.add_people_as_owner(it, jsonb_build_array(jsonb_build_object('email','Fine@idn.test','roleIds',jsonb_build_array(exec_role::text),'subject',i3)));
   res := res || 'owner_adds_person=' || (cnt = 1) || ';';
   begin perform kpi.add_people_as_owner(it, jsonb_build_array(jsonb_build_object('email','FINE@idn.test','roleIds',jsonb_build_array(exec_role::text),'subject',gen_random_uuid())));
     res := res || 'same_person_twice=ALLOWED(BUG);'; exception when sqlstate '23505' then res := res || 'same_person_twice=blocked;'; end;
   reset role;
   select count(*) into cnt from kpi.member_roles mr join kpi.memberships m on m.id = mr.member_id where m.tenant_id = it and m.subject = i3 and mr.role_id = exec_role;
   select count(*) into ev from kpi.audit where tenant_id = it and event = 'member.created_by_owner' and subject = i1;
   res := res || 'new_person_has_the_role=' || (cnt = 1) || ';';
   res := res || 'audit_says_owner_did_it=' || (ev = 1) || ';';
   select count(*) into cnt from kpi.memberships where tenant_id = it;
   res := res || 'failed_attempts_left_nothing=' || (cnt = 3) || ';';
  end;

  -- 12. the owner as manager: retire, who sees a KPI, units, password resets
  declare
    m1 uuid := gen_random_uuid(); m2 uuid := gen_random_uuid(); m3 uuid := gen_random_uuid(); mt uuid; mt2 uuid;
    exec_role uuid; kd uuid; root_u uuid; leaf uuid; parent_u uuid; mem uuid; mem_shared uuid; mem_owner uuid; mem_other uuid; cnt int; st text; sub uuid;
  begin
   set local role kpi_control_app; perform set_config('kpi.subject', A::text, true);
   mt := kpi_control.provision_with_people('Manager Co', 'diagnostics-lab', jsonb_build_array(
     jsonb_build_object('email','owner@mgr.test','owner',true,'subject',m1),
     jsonb_build_object('email','ceo@mgr.test','roleKeys','["executive"]'::jsonb,'subject',m2)));
   perform kpi_control.record_creation(mt, true, 'owner@mgr.test', true);
   mt2 := kpi_control.provision_with_people('Manager Other', 'diagnostics-lab', jsonb_build_array(
     jsonb_build_object('email','o@mgr2.test','owner',true,'subject',gen_random_uuid()),
     jsonb_build_object('email','shared@mgr.test','roleKeys','["executive"]'::jsonb,'subject',m3)));
   perform kpi_control.record_creation(mt2, true, 'o@mgr2.test', true);
   reset role;
   select id into exec_role from kpi.roles where tenant_id=mt and template_key='executive';
   select id into kd from kpi.definitions where tenant_id=mt and state='active' and not exists(
     select 1 from kpi.grants g join kpi.definitions v on v.tenant_id=g.tenant_id and v.id=g.kpi_id
     where g.tenant_id=mt and g.role_id=exec_role and v.key=kpi.definitions.key) limit 1;
   select id into root_u from kpi.units where tenant_id=mt and parent_id is null;
   insert into kpi.memberships(tenant_id,subject,display_name,email) values (mt, m3, 'shared', 'shared@mgr.test');

   set local role kpi_app;
   perform set_config('kpi.subject', m2::text, true);
   begin perform kpi.retire_kpi(mt, kd); res := res || 'member_retires_kpi=ALLOWED(BUG);';
   exception when insufficient_privilege then res := res || 'member_retires_kpi=blocked;'; end;
   begin perform kpi.set_kpi_audience(mt, kd, array[exec_role]); res := res || 'member_sets_audience=ALLOWED(BUG);';
   exception when insufficient_privilege then res := res || 'member_sets_audience=blocked;'; end;
   begin perform kpi.rename_unit(mt, root_u, 'X', 'Y'); res := res || 'member_renames_unit=ALLOWED(BUG);';
   exception when insufficient_privilege then res := res || 'member_renames_unit=blocked;'; end;
   select count(*) into cnt from kpi.definitions where tenant_id=mt and id=kd;
   res := res || 'executive_sees_kpi_before=' || (case when cnt = 0 then 'no' else 'yes' end) || ';';

   perform set_config('kpi.subject', m1::text, true);
   perform kpi.set_kpi_audience(mt, kd, array[exec_role]);
   perform set_config('kpi.subject', m2::text, true);
   select count(*) into cnt from kpi.definitions where tenant_id=mt and id=kd;
   res := res || 'audience_shows_kpi=' || (cnt = 1) || ';';
   perform set_config('kpi.subject', m1::text, true);
   perform kpi.set_kpi_audience(mt, kd, '{}');
   perform set_config('kpi.subject', m2::text, true);
   select count(*) into cnt from kpi.definitions where tenant_id=mt and id=kd;
   res := res || 'audience_hides_kpi=' || (cnt = 0) || ';';
   perform set_config('kpi.subject', m1::text, true);
   begin perform kpi.set_kpi_audience(mt, kd, array[(select id from kpi.roles where tenant_id=mt2 limit 1)]);
     res := res || 'audience_foreign_role=ALLOWED(BUG);'; exception when sqlstate '22023' then res := res || 'audience_foreign_role=blocked;'; end;
   begin perform kpi.retire_kpi(mt2, (select id from kpi.definitions where tenant_id=mt2 limit 1));
     res := res || 'owner_retires_other_org_kpi=ALLOWED(BUG);'; exception when insufficient_privilege then res := res || 'owner_retires_other_org_kpi=blocked;'; end;
   perform kpi.retire_kpi(mt, kd);
   select state into st from kpi.definitions where tenant_id=mt and id=kd;
   res := res || 'owner_retires_kpi=' || (st = 'retired') || ';';
   begin perform kpi.retire_kpi(mt, kd); res := res || 'retire_twice=ALLOWED(BUG);';
   exception when sqlstate '55000' then res := res || 'retire_twice=blocked;'; end;
   begin update kpi.definitions set state='active' where id=kd; res := res || 'unretire=ALLOWED(BUG);';
   exception when others then res := res || 'unretire=blocked;'; end;

   -- units
   insert into kpi.units(tenant_id,name,kind,parent_id) values(mt,'Parent','Region',root_u) returning id into parent_u;
   insert into kpi.units(tenant_id,name,kind,parent_id) values(mt,'Leaf','Branch',parent_u) returning id into leaf;
   perform kpi.rename_unit(mt, leaf, 'Renamed', 'Branch');
   select name into st from kpi.units where id=leaf;
   res := res || 'owner_renames_unit=' || (st = 'Renamed') || ';';
   begin perform kpi.delete_unit(mt, parent_u); res := res || 'delete_unit_with_children=ALLOWED(BUG);';
   exception when sqlstate '55000' then res := res || 'delete_unit_with_children=blocked;'; end;
   begin perform kpi.delete_unit(mt, root_u); res := res || 'delete_root=ALLOWED(BUG);';
   exception when sqlstate '55000' then res := res || 'delete_root=blocked;'; end;
   perform kpi.delete_unit(mt, leaf);
   select count(*) into cnt from kpi.units where id=leaf;
   res := res || 'owner_deletes_unused_unit=' || (cnt = 0) || ';';
   reset role;

   -- password resets: only the owner, only someone who belongs nowhere else
   -- look the members up first: the identity role cannot read memberships at all
   select id into mem from kpi.memberships where tenant_id=mt and subject=m2;
   select id into mem_shared from kpi.memberships where tenant_id=mt and subject=m3;
   select id into mem_owner from kpi.memberships where tenant_id=mt and owner;
   select id into mem_other from kpi.memberships where tenant_id=mt2 and not owner limit 1;
   set local role kpi_identity_app;
   perform set_config('kpi.subject', m2::text, true);
   begin perform kpi.prepare_password_reset(mt, mem); res := res || 'member_resets=ALLOWED(BUG);';
   exception when insufficient_privilege then res := res || 'member_resets=blocked;'; end;
   perform set_config('kpi.subject', m1::text, true);
   sub := kpi.prepare_password_reset(mt, mem);
   res := res || 'owner_resets_member=' || (sub = m2) || ';';
   begin perform kpi.prepare_password_reset(mt, mem_shared);
     res := res || 'reset_shared_login=ALLOWED(BUG);'; exception when sqlstate '55000' then res := res || 'reset_shared_login=blocked;'; end;
   begin perform kpi.prepare_password_reset(mt, mem_owner);
     res := res || 'reset_owner=ALLOWED(BUG);'; exception when sqlstate '55000' then res := res || 'reset_owner=blocked;'; end;
   begin perform kpi.prepare_password_reset(mt2, mem_other);
     res := res || 'reset_in_other_org=ALLOWED(BUG);'; exception when insufficient_privilege then res := res || 'reset_in_other_org=blocked;'; end;
   reset role;
   res := res || 'identity_role_cannot_retire=' || (case when has_function_privilege('kpi_identity_app','kpi.retire_kpi(uuid,uuid)','execute') then 'ALLOWED(BUG)' else 'blocked' end) || ';';
   res := res || 'customer_role_cannot_prepare_reset=' || (case when has_function_privilege('kpi_app','kpi.prepare_password_reset(uuid,uuid)','execute') then 'ALLOWED(BUG)' else 'blocked' end) || ';';
  end;

  raise exception 'SMOKE_RESULT %', res;
end $$;
