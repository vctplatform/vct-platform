-- ===============================================================
-- VCT Platform — Migration 0069: GRAPHQL-READY JSON FUNCTIONS
-- P3: Nested JSON builders, Relay pagination, batch loading
-- ===============================================================

BEGIN;

-- 1. TOURNAMENT FULL JSON
CREATE OR REPLACE FUNCTION api_v1.tournament_json(p_id UUID)
RETURNS JSONB AS $$
DECLARE v JSONB; v_t UUID;
BEGIN
  v_t := COALESCE(current_setting('app.current_tenant',true)::UUID,
    '00000000-0000-7000-8000-000000000001'::UUID);
  SELECT jsonb_build_object(
    'id',t.id,'name',t.name,'status',t.status,
    'startDate',t.start_date,'endDate',t.end_date,'location',t.location,
    'athletes',(SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'id',a.id,'hoTen',a.ho_ten,'canNang',a.can_nang,'trangThai',a.trang_thai
    )),'[]') FROM athletes a WHERE a.tournament_id=t.id AND a.is_deleted=false AND a.tenant_id=v_t),
    'teams',(SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'id',tm.id,'ten',tm.ten,'tinhThanh',tm.tinh_thanh
    )),'[]') FROM teams tm WHERE tm.tournament_id=t.id AND tm.is_deleted=false AND tm.tenant_id=v_t),
    'matches',(SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'id',m.id,'trangThai',m.trang_thai,'vdvDoId',m.vdv_do_id,'vdvXanhId',m.vdv_xanh_id
    )),'[]') FROM (SELECT * FROM combat_matches WHERE tournament_id=t.id AND is_deleted=false LIMIT 50) m)
  ) INTO v FROM tournaments t WHERE t.id=p_id AND t.is_deleted=false AND t.tenant_id=v_t;
  RETURN v;
END; $$ LANGUAGE plpgsql STABLE;

-- 2. ATHLETE PROFILE JSON
CREATE OR REPLACE FUNCTION api_v1.athlete_json(p_id UUID)
RETURNS JSONB AS $$
DECLARE v JSONB;
BEGIN
  SELECT jsonb_build_object(
    'id',a.id,'hoTen',a.ho_ten,'maVdv',a.ma_vdv,'ngaySinh',a.ngay_sinh,
    'gioiTinh',a.gioi_tinh,'canNang',a.can_nang,'trangThai',a.trang_thai,
    'ratings',(SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'category',r.category,'rating',r.rating,'wins',r.wins,'losses',r.losses
    )),'[]') FROM tournament.athlete_ratings r WHERE r.athlete_id=a.id AND r.is_active=true),
    'recentMatches',(SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'result',rh.result,'ratingChange',rh.rating_change,'recordedAt',rh.recorded_at
    )),'[]') FROM (SELECT * FROM tournament.rating_history WHERE athlete_id=a.id ORDER BY recorded_at DESC LIMIT 10) rh)
  ) INTO v FROM athletes a WHERE a.id=p_id AND a.is_deleted=false;
  RETURN v;
END; $$ LANGUAGE plpgsql STABLE;

-- 3. RELAY CONNECTION PAGINATION
CREATE OR REPLACE FUNCTION api_v1.to_connection(
  p_table TEXT, p_where TEXT DEFAULT 'true',
  p_order TEXT DEFAULT 'created_at DESC',
  p_first INT DEFAULT 20, p_after TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE v_edges JSONB; v_total BIGINT; v_has_next BOOLEAN;
BEGIN
  EXECUTE format('SELECT count(*) FROM %s WHERE %s',p_table,p_where) INTO v_total;
  EXECUTE format(
    'SELECT COALESCE(jsonb_agg(jsonb_build_object(
       ''node'',to_jsonb(t),''cursor'',encode(t.id::TEXT::BYTEA,''base64'')
     )),''[]'') FROM (SELECT * FROM %s t WHERE %s %s ORDER BY %s LIMIT %s) t',
    p_table, p_where,
    CASE WHEN p_after IS NOT NULL THEN format(' AND t.id>%L::UUID',
      convert_from(decode(p_after,'base64'),'UTF8')) ELSE '' END,
    p_order, p_first+1
  ) INTO v_edges;
  v_has_next := jsonb_array_length(v_edges)>p_first;
  IF v_has_next THEN v_edges:=v_edges-(jsonb_array_length(v_edges)-1); END IF;
  RETURN jsonb_build_object('edges',v_edges,'pageInfo',jsonb_build_object(
    'hasNextPage',v_has_next,'hasPreviousPage',p_after IS NOT NULL,'totalCount',v_total
  ));
END; $$ LANGUAGE plpgsql STABLE;

-- 4. BATCH LOADER (DataLoader pattern)
CREATE OR REPLACE FUNCTION api_v1.batch_load(p_table TEXT, p_ids UUID[])
RETURNS JSONB AS $$
DECLARE v JSONB;
BEGIN
  EXECUTE format(
    'SELECT COALESCE(jsonb_object_agg(t.id::TEXT,to_jsonb(t)),''{}''::JSONB)
     FROM %s t WHERE t.id=ANY($1) AND (t.is_deleted IS NULL OR t.is_deleted=false)',
    p_table) INTO v USING p_ids;
  RETURN v;
END; $$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION api_v1.batch_athletes(p_ids UUID[])
RETURNS JSONB AS $$ SELECT api_v1.batch_load('athletes',p_ids); $$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION api_v1.batch_tournaments(p_ids UUID[])
RETURNS JSONB AS $$ SELECT api_v1.batch_load('tournaments',p_ids); $$ LANGUAGE sql STABLE;

COMMIT;
