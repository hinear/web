-- Feature: 009-api-sql-performance
-- Purpose: move issue text search from ilike scans to PostgreSQL full-text search

alter table public.issues
  add column if not exists search_vector tsvector
  generated always as (
    to_tsvector(
      'simple',
      coalesce(title, '') || ' ' || coalesce(description, '')
    )
  ) stored;

create index if not exists issues_search_vector_idx
  on public.issues
  using gin (search_vector);

analyze public.issues;
