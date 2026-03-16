-- Rollback 0072: Read Replica Routing
BEGIN;
DROP VIEW IF EXISTS system.v_routing_advice CASCADE;
DROP VIEW IF EXISTS system.v_replica_dashboard CASCADE;
DROP FUNCTION IF EXISTS system.check_replica_health CASCADE;
DROP FUNCTION IF EXISTS system.route_query CASCADE;
DROP TABLE IF EXISTS system.replica_registry CASCADE;
DELETE FROM system.scheduled_tasks WHERE name = 'check_replica_health';
COMMIT;
