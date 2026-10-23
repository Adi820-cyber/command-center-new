-- ============================================================================
-- 20261031000100_pgvector_knowledge_chunks.sql
--
-- 1. Enable pgvector extension for high-performance vector similarity search.
-- 2. Create kpi.knowledge_chunks table to store contextual data and vector embeddings.
-- 3. Row-Level Security (RLS) guarantees role-wise scoping: each employee sees only
--    chunks, KPIs, and results that their assigned role is authorized to access.
-- 4. Hybrid search function combining pgvector cosine similarity with full-text search.
-- 5. Automatic knowledge refresh function to build plain-text chunks from definitions,
--    results, and actions.
-- ============================================================================
begin;

-- Enable pgvector in public schema (globally accessible to all application roles)
create extension if not exists vector with schema public;

-- Helper function: check if caller's active user in tenant has any matching role
create or replace function kpi.has_any_role(p_tenant_id uuid, r_keys text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from kpi.memberships m
    join kpi.member_roles mr on mr.tenant_id = m.tenant_id and mr.member_id = m.id
    join kpi.roles r on r.tenant_id = mr.tenant_id and r.id = mr.role_id
    where m.tenant_id = p_tenant_id
      and m.subject = kpi.subject()
      and m.active
      and (
        r.template_key = any(r_keys)
        or r.name = any(r_keys)
        or lower(r.template_key) = any(r_keys)
        or lower(r.name) = any(r_keys)
      )
  );
$$;

grant execute on function kpi.has_any_role(uuid, text[]) to kpi_app;

-- Table: kpi.knowledge_chunks
create table if not exists kpi.knowledge_chunks (
  id                uuid primary key default gen_random_uuid(),
  tenant_id         uuid not null references kpi.organizations(id) on delete cascade,
  kpi_id            uuid references kpi.definitions(id) on delete cascade,
  unit_id           uuid references kpi.units(id) on delete cascade,
  title             text not null,
  content           text not null,
  category          text not null default 'general',
  domain            text not null default 'general',
  source            text not null default 'auto',
  source_key        text,
  visible_role_keys text[] not null default '{}',
  content_hash      text,
  embedded_hash     text,
  embedding_model   text,
  embedding         public.vector(1024),
  fts               tsvector generated always as (to_tsvector('english', title || ' ' || content)) stored,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table kpi.knowledge_chunks is
  'Multi-tenant contextual knowledge and embeddings for the Ask chatbot with role-level RLS.';

create unique index if not exists knowledge_chunks_tenant_source_key_idx
  on kpi.knowledge_chunks(tenant_id, source_key) where source_key is not null;

create index if not exists knowledge_chunks_fts_idx
  on kpi.knowledge_chunks using gin(fts);

create index if not exists knowledge_chunks_tenant_idx
  on kpi.knowledge_chunks(tenant_id);

create index if not exists knowledge_chunks_kpi_idx
  on kpi.knowledge_chunks(tenant_id, kpi_id);

-- Explicit table permissions for kpi_app and kpi_control_app
grant select, insert, update, delete on kpi.knowledge_chunks to kpi_app;
grant select on kpi.knowledge_chunks to kpi_control_app;

-- RLS: Role-wise visibility
alter table kpi.knowledge_chunks enable row level security;
alter table kpi.knowledge_chunks force row level security;

drop policy if exists knowledge_chunks_read on kpi.knowledge_chunks;
create policy knowledge_chunks_read on kpi.knowledge_chunks
  for select to kpi_app
  using (
    kpi.is_member(tenant_id)
    and (
      kpi.is_owner(tenant_id)
      or (
        (kpi_id is null or kpi.can_view_definition(tenant_id, kpi_id))
        and (unit_id is null or kpi.allowed(tenant_id, 'view', unit_id, kpi_id))
        and (
          cardinality(visible_role_keys) = 0
          or kpi.has_any_role(tenant_id, visible_role_keys)
        )
      )
    )
  );

drop policy if exists knowledge_chunks_write on kpi.knowledge_chunks;
create policy knowledge_chunks_write on kpi.knowledge_chunks
  for all to kpi_app
  using (kpi.is_owner(tenant_id))
  with check (kpi.is_owner(tenant_id));

-- Function to refresh chunks for a tenant
create or replace function kpi.refresh_tenant_knowledge(p_tenant_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  inserted integer := 0;
  org_rec record;
begin
  if not (
    kpi.is_member(p_tenant_id)
    or kpi.is_platform()
    or current_user in ('postgres', 'supabase_admin', 'cc_kpi_data_login')
  ) then
    raise exception 'Unauthorized' using errcode = '42501';
  end if;

  -- 1. Organization profile chunk
  select o.id, o.name, o.status into org_rec from kpi.organizations o where o.id = p_tenant_id;
  if org_rec.id is not null then
    insert into kpi.knowledge_chunks(tenant_id, title, content, category, domain, source, source_key)
    values (
      p_tenant_id,
      'Organization Profile: ' || org_rec.name,
      'Organization ' || org_rec.name || ' status is ' || org_rec.status || '. ' ||
      (select count(*)::text from kpi.units where tenant_id = p_tenant_id) || ' units, ' ||
      (select count(*)::text from kpi.definitions where tenant_id = p_tenant_id and state = 'active') || ' active KPIs, and ' ||
      (select count(*)::text from kpi.roles where tenant_id = p_tenant_id) || ' operational roles configured.',
      'organization',
      'executive',
      'auto',
      'org:' || p_tenant_id
    )
    on conflict (tenant_id, source_key) where source_key is not null
    do update set
      title = excluded.title,
      content = excluded.content,
      updated_at = now()
    where kpi.knowledge_chunks.content is distinct from excluded.content;
    inserted := inserted + 1;
  end if;

  -- 2. Active KPI definitions
  insert into kpi.knowledge_chunks(tenant_id, kpi_id, title, content, category, domain, source, source_key, visible_role_keys)
  select
    d.tenant_id,
    d.id,
    'KPI Definition: ' || d.name,
    d.name || ' (' || coalesce(d.domain, 'general') || '): ' || coalesce(d.description, 'No description provided.') ||
    ' Direction: ' || d.direction || ' is better. Unit: ' || d.unit || '.' ||
    case when d.target is not null then ' Target: ' || d.target::text || ' ' || d.unit || '.' else ' Target: None specified.' end ||
    ' Formula: ' || coalesce(d.formula::text, 'Direct input') || '.',
    'kpi_definition',
    coalesce(d.domain, 'general'),
    'auto',
    'kpi:' || d.id,
    coalesce(
      (select array_agg(distinct r.template_key) from kpi.grants g join kpi.roles r on r.id = g.role_id where g.tenant_id = d.tenant_id and g.kpi_id = d.id and r.template_key is not null),
      '{}'
    )
  from kpi.definitions d
  where d.tenant_id = p_tenant_id and d.state = 'active'
  on conflict (tenant_id, source_key) where source_key is not null
  do update set
    title = excluded.title,
    content = excluded.content,
    visible_role_keys = excluded.visible_role_keys,
    updated_at = now()
  where kpi.knowledge_chunks.content is distinct from excluded.content;

  -- 3. Latest KPI results
  insert into kpi.knowledge_chunks(tenant_id, kpi_id, unit_id, title, content, category, domain, source, source_key)
  select distinct on (r.kpi_id, r.unit_id)
    r.tenant_id,
    r.kpi_id,
    r.unit_id,
    'KPI Performance: ' || d.name || ' (' || r.period_start::text || ' to ' || r.period_end::text || ')',
    d.name || ' recorded value ' || coalesce((r.value->>'number')::text, '0') || ' ' || d.unit || ' for period ' ||
    r.period_start::text || ' to ' || r.period_end::text || ' on unit ' || coalesce(u.name, 'All Units') || '. ' ||
    case when r.on_target is true then 'Status: On Target.' when r.on_target is false then 'Status: Off Target.' else 'Status: Target not evaluated.' end ||
    case when r.target is not null then ' Target: ' || r.target::text || ' ' || d.unit || '.' else '' end,
    'kpi_result',
    coalesce(d.domain, 'general'),
    'auto',
    'result:' || r.id
  from kpi.results r
  join kpi.definitions d on d.tenant_id = r.tenant_id and d.id = r.kpi_id
  left join kpi.units u on u.tenant_id = r.tenant_id and u.id = r.unit_id
  where r.tenant_id = p_tenant_id
  order by r.kpi_id, r.unit_id, r.period_end desc, r.computed_at desc
  on conflict (tenant_id, source_key) where source_key is not null
  do update set
    title = excluded.title,
    content = excluded.content,
    updated_at = now()
  where kpi.knowledge_chunks.content is distinct from excluded.content;

  -- 4. Open actions
  insert into kpi.knowledge_chunks(tenant_id, kpi_id, title, content, category, domain, source, source_key)
  select
    a.tenant_id,
    r.kpi_id,
    'Executive Action: ' || a.title,
    'Action item: "' || a.title || '" is currently in state: ' || a.state || '. Assigned to: ' || coalesce(m.display_name, 'Unassigned') ||
    case when a.due_date is not null then '. Due date: ' || a.due_date::text else '' end ||
    case when d.name is not null then '. Linked to KPI: ' || d.name else '' end || '.',
    'action',
    coalesce(d.domain, 'general'),
    'auto',
    'action:' || a.id
  from kpi.actions a
  left join kpi.results r on r.tenant_id = a.tenant_id and r.id = a.result_id
  left join kpi.definitions d on d.tenant_id = r.tenant_id and d.id = r.kpi_id
  left join kpi.memberships m on m.tenant_id = a.tenant_id and m.id = a.assignee_id
  where a.tenant_id = p_tenant_id and a.state not in ('dismissed', 'completed')
  on conflict (tenant_id, source_key) where source_key is not null
  do update set
    title = excluded.title,
    content = excluded.content,
    updated_at = now()
  where kpi.knowledge_chunks.content is distinct from excluded.content;

  return (select count(*)::integer from kpi.knowledge_chunks where tenant_id = p_tenant_id);
end;
$$;

-- Search function (Security Invoker respects RLS policies for role-wise scoping)
create or replace function kpi.search_knowledge(
  p_tenant_id uuid,
  p_query     text,
  p_embedding public.vector(1024) default null,
  p_limit     integer default 6,
  p_threshold float   default 0.25
)
returns table (
  id         uuid,
  title      text,
  content    text,
  category   text,
  domain     text,
  source     text,
  similarity float,
  matched_by text,
  kpi_id     uuid,
  unit_id    uuid,
  updated_at timestamptz
)
language sql
stable
security invoker
set search_path = public, pg_catalog, kpi
as $$
  with terms as (
    select array(
      select distinct l from unnest(tsvector_to_array(to_tsvector('english', coalesce(p_query, '')))) l
      where l ~ '^[a-z0-9]+$'
    ) as term_arr
  ),
  tsq as (
    select to_tsquery('simple', array_to_string(term_arr, ' | ')) as query, term_arr, cardinality(term_arr) as n
    from terms where cardinality(term_arr) > 0
  ),
  vec as (
    select k.id, (1 - (k.embedding <=> p_embedding))::float as score
    from kpi.knowledge_chunks k
    where k.tenant_id = p_tenant_id and p_embedding is not null and k.embedding is not null
    order by k.embedding <=> p_embedding
    limit greatest(p_limit, 1) * 3
  ),
  matches as (
    select k.id,
           case when tsq.n > 0 then (select count(*) from unnest(tsq.term_arr) l where k.fts @@ to_tsquery('simple', l))::float / tsq.n else 0 end as coverage,
           ts_rank_cd(k.fts, tsq.query, 32)::float as density
    from kpi.knowledge_chunks k, tsq
    where k.tenant_id = p_tenant_id and k.fts @@ tsq.query
  ),
  fts as (
    select m.id, (0.75 * m.coverage + 0.25 * m.density)::float as score
    from matches m
    where m.coverage >= 0.25 or m.density > 0.05
    order by 2 desc
    limit greatest(p_limit, 1) * 4
  ),
  merged as (
    select coalesce(v.id, f.id) as id, v.score as vscore, f.score as fscore
    from vec v full join fts f on f.id = v.id
    where f.id is not null or (v.score is not null and v.score > p_threshold)
  ),
  scored as (
    select
      k.id, k.title, k.content, k.category, k.domain, k.source,
      least(1.0, greatest(coalesce(m.vscore, 0), coalesce(m.fscore, 0)) + case when m.vscore is not null and m.fscore is not null then 0.1 else 0 end)::float as similarity,
      case when m.vscore is not null and m.fscore is not null then 'hybrid'
           when m.vscore is not null then 'vector' else 'text' end as matched_by,
      k.kpi_id, k.unit_id, k.updated_at
    from merged m
    join kpi.knowledge_chunks k on k.id = m.id
    where k.tenant_id = p_tenant_id
  )
  select id, title, content, category, domain, source, similarity, matched_by, kpi_id, unit_id, updated_at
  from scored
  order by similarity desc, title
  limit greatest(p_limit, 1)
$$;

-- Helper to store embeddings
create or replace function kpi.set_chunk_embedding(
  p_id        uuid,
  p_embedding public.vector(1024),
  p_model     text default 'lfm-2.5-embedding-350m'
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  update kpi.knowledge_chunks
  set embedding = p_embedding,
      embedding_model = p_model,
      updated_at = now()
  where id = p_id;
  return found;
end;
$$;

grant execute on function kpi.refresh_tenant_knowledge(uuid) to kpi_app;
grant execute on function kpi.search_knowledge(uuid, text, public.vector, integer, float) to kpi_app;
grant execute on function kpi.set_chunk_embedding(uuid, public.vector, text) to kpi_app;

commit;
