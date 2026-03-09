BEGIN;

DO $seed$
BEGIN
  IF to_regclass('public.entity_records') IS NULL THEN
    RAISE NOTICE 'entity_records table not found, skip seed 0001';
    RETURN;
  END IF;

  EXECUTE $sql$
    INSERT INTO entity_records(entity, id, payload)
    VALUES
      (
        'tournament-config',
        'TOURNAMENT-2026',
        '{
          "id":"TOURNAMENT-2026",
          "ten_giai":"Giai Vo Co Truyen Toan Quoc 2026",
          "ma_giai":"VCT-2026",
          "cap_do":"quoc_gia",
          "ngay_bat_dau":"2026-08-15",
          "ngay_ket_thuc":"2026-08-20",
          "dia_diem":"Nha thi dau Quy Nhon",
          "trang_thai":"dang_ky",
          "operation_shift":"sang"
        }'::jsonb
      ),
      (
        'teams',
        'DV01',
        '{
          "id":"DV01",
          "ma":"BD",
          "ten":"Doan Binh Dinh",
          "tat":"BD",
          "loai":"doan_tinh",
          "tinh":"Binh Dinh",
          "truong_doan":"Nguyen Van Trong",
          "sdt":"0900000001",
          "email":"bd@vct.vn",
          "trang_thai":"da_xac_nhan"
        }'::jsonb
      ),
      (
        'teams',
        'DV02',
        '{
          "id":"DV02",
          "ma":"HN",
          "ten":"Doan Ha Noi",
          "tat":"HN",
          "loai":"doan_tinh",
          "tinh":"Ha Noi",
          "truong_doan":"Tran Tuan Anh",
          "sdt":"0900000002",
          "email":"hn@vct.vn",
          "trang_thai":"da_xac_nhan"
        }'::jsonb
      ),
      (
        'athletes',
        'VDV01',
        '{
          "id":"VDV01",
          "ho_ten":"Pham Hoang Nam",
          "gioi":"nam",
          "doan_id":"DV01",
          "doan_ten":"BD",
          "can_nang":55,
          "trang_thai":"du_dieu_kien"
        }'::jsonb
      ),
      (
        'athletes',
        'VDV02',
        '{
          "id":"VDV02",
          "ho_ten":"Le Thu Huong",
          "gioi":"nu",
          "doan_id":"DV02",
          "doan_ten":"HN",
          "can_nang":50,
          "trang_thai":"du_dieu_kien"
        }'::jsonb
      ),
      (
        'registration',
        'DK01',
        '{
          "id":"DK01",
          "vdv_id":"VDV01",
          "vdv_ten":"Pham Hoang Nam",
          "doan_id":"DV01",
          "doan_ten":"BD",
          "loai":"doi_khang",
          "nd_id":"HC55",
          "nd_ten":"Nam 55kg",
          "trang_thai":"da_duyet"
        }'::jsonb
      ),
      (
        'results',
        'RS01',
        '{
          "id":"RS01",
          "loai":"doi_khang",
          "noi_dung":"Nam 55kg",
          "vdv_ten":"Pham Hoang Nam",
          "doan":"BD",
          "ket_qua":"Thang diem",
          "diem":"5:2",
          "huy_chuong":""
        }'::jsonb
      ),
      (
        'schedule',
        'L01',
        '{
          "id":"L01",
          "ngay":"2026-08-15",
          "phien":"sang",
          "gio_bat_dau":"08:00",
          "gio_ket_thuc":"11:30",
          "san_id":"S01",
          "noi_dung":"Nam 55kg",
          "so_tran":8,
          "trang_thai":"xac_nhan"
        }'::jsonb
      ),
      (
        'arenas',
        'S01',
        '{
          "id":"S01",
          "ten":"San 1",
          "vi_tri":"Nha thi dau A",
          "loai":"doi_khang",
          "trang_thai":"san_sang"
        }'::jsonb
      ),
      (
        'arenas',
        'S02',
        '{
          "id":"S02",
          "ten":"San 2",
          "vi_tri":"Nha thi dau A",
          "loai":"quyen",
          "trang_thai":"san_sang"
        }'::jsonb
      ),
      (
        'referees',
        'TT01',
        '{
          "id":"TT01",
          "ho_ten":"Dang Quoc Minh",
          "cap_bac":"quoc_gia",
          "chuyen_mon":"ca_hai",
          "trang_thai":"xac_nhan"
        }'::jsonb
      ),
      (
        'referees',
        'TT02',
        '{
          "id":"TT02",
          "ho_ten":"Vo Hai Yen",
          "cap_bac":"cap_1",
          "chuyen_mon":"quyen",
          "trang_thai":"xac_nhan"
        }'::jsonb
      ),
      (
        'appeals',
        'KN01',
        '{
          "id":"KN01",
          "doan_id":"DV02",
          "doan_ten":"Doan Ha Noi",
          "loai":"khieu_nai",
          "trang_thai":"dang_xu_ly",
          "ly_do":"De nghi xem lai diem ky thuat",
          "thoi_gian_nop":"2026-08-15T10:20:00+07:00"
        }'::jsonb
      ),
      (
        'weigh-ins',
        'CAN01',
        '{
          "id":"CAN01",
          "vdv_id":"VDV01",
          "vdv_ten":"Pham Hoang Nam",
          "doan_ten":"BD",
          "hang_can_dk":"Nam 55kg",
          "can_thuc_te":54.8,
          "ket_qua":"dat"
        }'::jsonb
      ),
      (
        'combat-matches',
        'TD01',
        '{
          "id":"TD01",
          "san_id":"S01",
          "hang_can":"Nam 55kg",
          "trang_thai":"chua_dau",
          "vdv_do":{"id":"VDV01","ten":"Pham Hoang Nam","doan":"BD"},
          "vdv_xanh":{"id":"VDV02","ten":"Le Thu Huong","doan":"HN"}
        }'::jsonb
      ),
      (
        'form-performances',
        'Q01',
        '{
          "id":"Q01",
          "san_id":"S02",
          "vdv_id":"VDV02",
          "vdv_ten":"Le Thu Huong",
          "doan_ten":"HN",
          "noi_dung":"Ngoc Tran Quyen",
          "diem":[8.8,8.9,9.0,8.7,8.9],
          "diem_tb":8.86,
          "xep_hang":1,
          "trang_thai":"da_cham"
        }'::jsonb
      ),
      (
        'content-categories',
        'NDQ01',
        '{
          "id":"NDQ01",
          "ten":"Ngoc Tran Quyen",
          "hinh_thuc":"ca_nhan",
          "gioi":"nu",
          "lua_tuoi":"Thanh nien",
          "trang_thai":"active"
        }'::jsonb
      ),
      (
        'content-categories',
        'HC55',
        '{
          "id":"HC55",
          "ten":"Nam 55kg",
          "loai":"doi_khang",
          "gioi":"nam",
          "trang_thai":"active"
        }'::jsonb
      ),
      (
        'referee-assignments',
        'PA01',
        '{
          "id":"PA01",
          "tt_id":"TT01",
          "san_id":"S01",
          "vai_tro":"chinh",
          "ngay":"2026-08-15",
          "phien":"sang"
        }'::jsonb
      )
    ON CONFLICT (entity, id) DO UPDATE
      SET payload = EXCLUDED.payload,
          updated_at = NOW();
  $sql$;
END
$seed$;

COMMIT;
