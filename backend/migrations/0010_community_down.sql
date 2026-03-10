-- Migration 0010 DOWN
BEGIN;
DROP TABLE IF EXISTS platform.marketplace_listings CASCADE;
DROP TABLE IF EXISTS platform.group_memberships CASCADE;
DROP TABLE IF EXISTS platform.community_groups CASCADE;
DROP TABLE IF EXISTS platform.follows CASCADE;
DROP TABLE IF EXISTS platform.reactions CASCADE;
DROP TABLE IF EXISTS platform.comments CASCADE;
DROP TABLE IF EXISTS platform.posts CASCADE;
COMMIT;
