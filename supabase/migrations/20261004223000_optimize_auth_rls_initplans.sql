-- RLS performance optimization generated from Supabase auth_rls_initplan findings on 2026-10-04.
-- This migration preserves every policy predicate and changes only auth.uid()/auth.jwt()/auth.role()
-- calls to scalar subselect form so PostgreSQL evaluates them once per statement instead of once per row.
-- Policies already using SELECT-wrapped auth calls are left unchanged inside each predicate.


