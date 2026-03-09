BEGIN;

DO $seed$
BEGIN
  IF to_regclass('public.users') IS NULL OR to_regclass('public.tournaments') IS NULL THEN
    RAISE NOTICE 'relational tables not found, skip seed 0002';
    RETURN;
  END IF;

  EXECUTE $sql$
    INSERT INTO users (
      id, username, password_hash, role, full_name, email, phone, is_active
    )
    VALUES
      (
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
        'admin',
        '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
        'admin',
        'VCT Admin',
        'admin@vct.vn',
        '0900000000',
        true
      ),
      (
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2',
        'btc',
        '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
        'btc',
        'Ban To Chuc',
        'btc@vct.vn',
        '0900000003',
        true
      ),
      (
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3',
        'delegate01',
        '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
        'delegate',
        'Truong Doan Demo',
        'delegate01@vct.vn',
        '0900000004',
        true
      )
    ON CONFLICT (username) DO UPDATE
      SET role = EXCLUDED.role,
          full_name = EXCLUDED.full_name,
          email = EXCLUDED.email,
          phone = EXCLUDED.phone,
          is_active = EXCLUDED.is_active,
          updated_at = NOW();
  $sql$;

  EXECUTE $sql$
    INSERT INTO tournaments (
      id, name, code, level, round_number, start_date, end_date, registration_deadline,
      location, venue, organizer, status, config
    )
    VALUES (
      '11111111-1111-1111-1111-111111111111',
      'Giai Vo Co Truyen Toan Quoc 2026',
      'VCT-2026',
      'quoc_gia',
      1,
      DATE '2026-08-15',
      DATE '2026-08-20',
      DATE '2026-07-31',
      'Binh Dinh',
      'Nha thi dau Quy Nhon',
      'Lien Doan VCT',
      'nhap',
      '{"operation_shift":"sang","allow_live_score":true}'::jsonb
    )
    ON CONFLICT (code) DO UPDATE
      SET name = EXCLUDED.name,
          level = EXCLUDED.level,
          round_number = EXCLUDED.round_number,
          start_date = EXCLUDED.start_date,
          end_date = EXCLUDED.end_date,
          registration_deadline = EXCLUDED.registration_deadline,
          location = EXCLUDED.location,
          venue = EXCLUDED.venue,
          organizer = EXCLUDED.organizer,
          status = EXCLUDED.status,
          config = EXCLUDED.config,
          updated_at = NOW();
  $sql$;

  EXECUTE $sql$
    INSERT INTO age_groups (id, tournament_id, ten, tuoi_min, tuoi_max)
    VALUES
      ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Thanh nien', 18, 35)
    ON CONFLICT (id) DO UPDATE
      SET ten = EXCLUDED.ten,
          tuoi_min = EXCLUDED.tuoi_min,
          tuoi_max = EXCLUDED.tuoi_max;
  $sql$;

  EXECUTE $sql$
    INSERT INTO content_categories (
      id, tournament_id, ten, loai, gioi_tinh, lua_tuoi_id, so_nguoi, mo_ta, trang_thai
    )
    VALUES
      (
        '33333333-3333-3333-3333-333333333333',
        '11111111-1111-1111-1111-111111111111',
        'Ngoc Tran Quyen',
        'quyen',
        'nu',
        '22222222-2222-2222-2222-222222222222',
        1,
        'Noi dung quyen nu',
        'active'
      ),
      (
        '33333333-3333-3333-3333-333333333334',
        '11111111-1111-1111-1111-111111111111',
        'Nam 55kg',
        'doi_khang',
        'nam',
        '22222222-2222-2222-2222-222222222222',
        1,
        'Noi dung doi khang nam',
        'active'
      )
    ON CONFLICT (id) DO UPDATE
      SET ten = EXCLUDED.ten,
          loai = EXCLUDED.loai,
          gioi_tinh = EXCLUDED.gioi_tinh,
          lua_tuoi_id = EXCLUDED.lua_tuoi_id,
          so_nguoi = EXCLUDED.so_nguoi,
          mo_ta = EXCLUDED.mo_ta,
          trang_thai = EXCLUDED.trang_thai;
  $sql$;

  EXECUTE $sql$
    INSERT INTO weight_classes (
      id, tournament_id, ten, gioi_tinh, lua_tuoi_id, can_nang_min, can_nang_max, trang_thai
    )
    VALUES (
      '44444444-4444-4444-4444-444444444444',
      '11111111-1111-1111-1111-111111111111',
      'Nam 55kg',
      'nam',
      '22222222-2222-2222-2222-222222222222',
      52.0,
      55.0,
      'active'
    )
    ON CONFLICT (id) DO UPDATE
      SET ten = EXCLUDED.ten,
          gioi_tinh = EXCLUDED.gioi_tinh,
          lua_tuoi_id = EXCLUDED.lua_tuoi_id,
          can_nang_min = EXCLUDED.can_nang_min,
          can_nang_max = EXCLUDED.can_nang_max,
          trang_thai = EXCLUDED.trang_thai;
  $sql$;

  EXECUTE $sql$
    INSERT INTO teams (
      id, tournament_id, ten, ma_doan, loai, tinh_thanh, lien_he, sdt, email, trang_thai,
      docs, fees, achievements, delegate_user_id
    )
    VALUES
      (
        '55555555-5555-5555-5555-555555555551',
        '11111111-1111-1111-1111-111111111111',
        'Doan Binh Dinh',
        'BD',
        'tinh',
        'Binh Dinh',
        'Nguyen Van Trong',
        '0900000001',
        'bd@vct.vn',
        'da_xac_nhan',
        '{}'::jsonb,
        '{"total":0,"paid":0,"remaining":0}'::jsonb,
        '[]'::jsonb,
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3'
      ),
      (
        '55555555-5555-5555-5555-555555555552',
        '11111111-1111-1111-1111-111111111111',
        'Doan Ha Noi',
        'HN',
        'tinh',
        'Ha Noi',
        'Tran Tuan Anh',
        '0900000002',
        'hn@vct.vn',
        'da_xac_nhan',
        '{}'::jsonb,
        '{"total":0,"paid":0,"remaining":0}'::jsonb,
        '[]'::jsonb,
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa3'
      )
    ON CONFLICT (id) DO UPDATE
      SET ten = EXCLUDED.ten,
          ma_doan = EXCLUDED.ma_doan,
          loai = EXCLUDED.loai,
          tinh_thanh = EXCLUDED.tinh_thanh,
          lien_he = EXCLUDED.lien_he,
          sdt = EXCLUDED.sdt,
          email = EXCLUDED.email,
          trang_thai = EXCLUDED.trang_thai,
          docs = EXCLUDED.docs,
          fees = EXCLUDED.fees,
          achievements = EXCLUDED.achievements,
          delegate_user_id = EXCLUDED.delegate_user_id,
          updated_at = NOW();
  $sql$;

  EXECUTE $sql$
    INSERT INTO athletes (
      id, tournament_id, team_id, ho_ten, gioi_tinh, ngay_sinh, can_nang, chieu_cao,
      trang_thai, docs, ghi_chu, avatar_url, user_id
    )
    VALUES
      (
        '66666666-6666-6666-6666-666666666661',
        '11111111-1111-1111-1111-111111111111',
        '55555555-5555-5555-5555-555555555551',
        'Pham Hoang Nam',
        'nam',
        DATE '2002-03-01',
        54.8,
        170.0,
        'du_dieu_kien',
        '{}'::jsonb,
        'Van dong vien doi khang',
        NULL,
        NULL
      ),
      (
        '66666666-6666-6666-6666-666666666662',
        '11111111-1111-1111-1111-111111111111',
        '55555555-5555-5555-5555-555555555552',
        'Le Thu Huong',
        'nu',
        DATE '2003-07-12',
        50.0,
        162.0,
        'du_dieu_kien',
        '{}'::jsonb,
        'Van dong vien quyen',
        NULL,
        NULL
      )
    ON CONFLICT (id) DO UPDATE
      SET tournament_id = EXCLUDED.tournament_id,
          team_id = EXCLUDED.team_id,
          ho_ten = EXCLUDED.ho_ten,
          gioi_tinh = EXCLUDED.gioi_tinh,
          ngay_sinh = EXCLUDED.ngay_sinh,
          can_nang = EXCLUDED.can_nang,
          chieu_cao = EXCLUDED.chieu_cao,
          trang_thai = EXCLUDED.trang_thai,
          docs = EXCLUDED.docs,
          ghi_chu = EXCLUDED.ghi_chu,
          avatar_url = EXCLUDED.avatar_url,
          user_id = EXCLUDED.user_id,
          updated_at = NOW();
  $sql$;

  EXECUTE $sql$
    INSERT INTO registrations (
      id, tournament_id, athlete_id, content_category_id, weight_class_id, trang_thai, ghi_chu
    )
    VALUES (
      '77777777-7777-7777-7777-777777777771',
      '11111111-1111-1111-1111-111111111111',
      '66666666-6666-6666-6666-666666666661',
      '33333333-3333-3333-3333-333333333334',
      '44444444-4444-4444-4444-444444444444',
      'da_duyet',
      'Dang ky hop le'
    )
    ON CONFLICT (id) DO UPDATE
      SET tournament_id = EXCLUDED.tournament_id,
          athlete_id = EXCLUDED.athlete_id,
          content_category_id = EXCLUDED.content_category_id,
          weight_class_id = EXCLUDED.weight_class_id,
          trang_thai = EXCLUDED.trang_thai,
          ghi_chu = EXCLUDED.ghi_chu,
          updated_at = NOW();
  $sql$;

  EXECUTE $sql$
    INSERT INTO arenas (
      id, tournament_id, ten, loai, trang_thai, suc_chua, vi_tri, ghi_chu, equipment
    )
    VALUES
      (
        '88888888-8888-8888-8888-888888888881',
        '11111111-1111-1111-1111-111111111111',
        'San 1',
        'doi_khang',
        'san_sang',
        500,
        'Nha thi dau A',
        NULL,
        '[]'::jsonb
      ),
      (
        '88888888-8888-8888-8888-888888888882',
        '11111111-1111-1111-1111-111111111111',
        'San 2',
        'quyen',
        'san_sang',
        300,
        'Nha thi dau A',
        NULL,
        '[]'::jsonb
      )
    ON CONFLICT (id) DO UPDATE
      SET tournament_id = EXCLUDED.tournament_id,
          ten = EXCLUDED.ten,
          loai = EXCLUDED.loai,
          trang_thai = EXCLUDED.trang_thai,
          suc_chua = EXCLUDED.suc_chua,
          vi_tri = EXCLUDED.vi_tri,
          ghi_chu = EXCLUDED.ghi_chu,
          equipment = EXCLUDED.equipment;
  $sql$;

  EXECUTE $sql$
    INSERT INTO referees (
      id, tournament_id, ho_ten, cap_bac, chuyen_mon, tinh_thanh, dien_thoai, email,
      nam_kinh_nghiem, trang_thai, ghi_chu, user_id
    )
    VALUES
      (
        '99999999-9999-9999-9999-999999999991',
        '11111111-1111-1111-1111-111111111111',
        'Dang Quoc Minh',
        'quoc_gia',
        'ca_hai',
        'Binh Dinh',
        '0900000011',
        'tt01@vct.vn',
        12,
        'xac_nhan',
        NULL,
        NULL
      ),
      (
        '99999999-9999-9999-9999-999999999992',
        '11111111-1111-1111-1111-111111111111',
        'Vo Hai Yen',
        'cap_1',
        'quyen',
        'Ha Noi',
        '0900000012',
        'tt02@vct.vn',
        9,
        'xac_nhan',
        NULL,
        NULL
      )
    ON CONFLICT (id) DO UPDATE
      SET tournament_id = EXCLUDED.tournament_id,
          ho_ten = EXCLUDED.ho_ten,
          cap_bac = EXCLUDED.cap_bac,
          chuyen_mon = EXCLUDED.chuyen_mon,
          tinh_thanh = EXCLUDED.tinh_thanh,
          dien_thoai = EXCLUDED.dien_thoai,
          email = EXCLUDED.email,
          nam_kinh_nghiem = EXCLUDED.nam_kinh_nghiem,
          trang_thai = EXCLUDED.trang_thai,
          ghi_chu = EXCLUDED.ghi_chu,
          user_id = EXCLUDED.user_id;
  $sql$;

  EXECUTE $sql$
    INSERT INTO referee_assignments (
      id, tournament_id, referee_id, arena_id, session_date, session_shift, role
    )
    VALUES (
      'aaaaaaa1-0000-0000-0000-000000000001',
      '11111111-1111-1111-1111-111111111111',
      '99999999-9999-9999-9999-999999999991',
      '88888888-8888-8888-8888-888888888881',
      DATE '2026-08-15',
      'sang',
      'chinh'
    )
    ON CONFLICT (id) DO UPDATE
      SET tournament_id = EXCLUDED.tournament_id,
          referee_id = EXCLUDED.referee_id,
          arena_id = EXCLUDED.arena_id,
          session_date = EXCLUDED.session_date,
          session_shift = EXCLUDED.session_shift,
          role = EXCLUDED.role;
  $sql$;

  EXECUTE $sql$
    INSERT INTO schedule_entries (
      id, tournament_id, ngay, buoi, gio_bat_dau, gio_ket_thuc, arena_id, content_category_id,
      so_tran, ghi_chu
    )
    VALUES (
      'bbbbbbb1-0000-0000-0000-000000000001',
      '11111111-1111-1111-1111-111111111111',
      DATE '2026-08-15',
      'sang',
      TIME '08:00',
      TIME '11:30',
      '88888888-8888-8888-8888-888888888881',
      '33333333-3333-3333-3333-333333333334',
      8,
      'Lich thi dau sang ngay khai mac'
    )
    ON CONFLICT (id) DO UPDATE
      SET tournament_id = EXCLUDED.tournament_id,
          ngay = EXCLUDED.ngay,
          buoi = EXCLUDED.buoi,
          gio_bat_dau = EXCLUDED.gio_bat_dau,
          gio_ket_thuc = EXCLUDED.gio_ket_thuc,
          arena_id = EXCLUDED.arena_id,
          content_category_id = EXCLUDED.content_category_id,
          so_tran = EXCLUDED.so_tran,
          ghi_chu = EXCLUDED.ghi_chu;
  $sql$;

  EXECUTE $sql$
    INSERT INTO weigh_ins (
      id, tournament_id, athlete_id, weight_class_id, can_nang_thuc, ket_qua, thoi_gian, nguoi_can, ghi_chu
    )
    VALUES (
      'ccccccc1-0000-0000-0000-000000000001',
      '11111111-1111-1111-1111-111111111111',
      '66666666-6666-6666-6666-666666666661',
      '44444444-4444-4444-4444-444444444444',
      54.8,
      'dat',
      NOW(),
      'Can bo y te',
      NULL
    )
    ON CONFLICT (id) DO UPDATE
      SET tournament_id = EXCLUDED.tournament_id,
          athlete_id = EXCLUDED.athlete_id,
          weight_class_id = EXCLUDED.weight_class_id,
          can_nang_thuc = EXCLUDED.can_nang_thuc,
          ket_qua = EXCLUDED.ket_qua,
          thoi_gian = EXCLUDED.thoi_gian,
          nguoi_can = EXCLUDED.nguoi_can,
          ghi_chu = EXCLUDED.ghi_chu;
  $sql$;

  EXECUTE $sql$
    INSERT INTO combat_matches (
      id, tournament_id, content_category_id, weight_class_id, arena_id,
      athlete_red_id, athlete_blue_id, vong, bracket_position, ket_qua, nguoi_thang_id,
      trang_thai, thoi_gian_bat_dau, thoi_gian_ket_thuc, ghi_chu
    )
    VALUES (
      'ddddddd1-0000-0000-0000-000000000001',
      '11111111-1111-1111-1111-111111111111',
      '33333333-3333-3333-3333-333333333334',
      '44444444-4444-4444-4444-444444444444',
      '88888888-8888-8888-8888-888888888881',
      '66666666-6666-6666-6666-666666666661',
      '66666666-6666-6666-6666-666666666662',
      'vong_1',
      1,
      NULL,
      NULL,
      'chua_dau',
      NULL,
      NULL,
      NULL
    )
    ON CONFLICT (id) DO UPDATE
      SET tournament_id = EXCLUDED.tournament_id,
          content_category_id = EXCLUDED.content_category_id,
          weight_class_id = EXCLUDED.weight_class_id,
          arena_id = EXCLUDED.arena_id,
          athlete_red_id = EXCLUDED.athlete_red_id,
          athlete_blue_id = EXCLUDED.athlete_blue_id,
          vong = EXCLUDED.vong,
          bracket_position = EXCLUDED.bracket_position,
          ket_qua = EXCLUDED.ket_qua,
          nguoi_thang_id = EXCLUDED.nguoi_thang_id,
          trang_thai = EXCLUDED.trang_thai,
          thoi_gian_bat_dau = EXCLUDED.thoi_gian_bat_dau,
          thoi_gian_ket_thuc = EXCLUDED.thoi_gian_ket_thuc,
          ghi_chu = EXCLUDED.ghi_chu,
          updated_at = NOW();
  $sql$;

  EXECUTE $sql$
    INSERT INTO form_performances (
      id, tournament_id, content_category_id, arena_id, athlete_id, judge_scores,
      diem_trung_binh, diem_tru_high, diem_tru_low, tong_diem, xep_hang, trang_thai, ghi_chu
    )
    VALUES (
      'eeeeeee1-0000-0000-0000-000000000001',
      '11111111-1111-1111-1111-111111111111',
      '33333333-3333-3333-3333-333333333333',
      '88888888-8888-8888-8888-888888888882',
      '66666666-6666-6666-6666-666666666662',
      '[8.8,8.9,9.0,8.7,8.9]'::jsonb,
      8.86,
      9.00,
      8.70,
      8.86,
      1,
      'da_cham',
      NULL
    )
    ON CONFLICT (id) DO UPDATE
      SET tournament_id = EXCLUDED.tournament_id,
          content_category_id = EXCLUDED.content_category_id,
          arena_id = EXCLUDED.arena_id,
          athlete_id = EXCLUDED.athlete_id,
          judge_scores = EXCLUDED.judge_scores,
          diem_trung_binh = EXCLUDED.diem_trung_binh,
          diem_tru_high = EXCLUDED.diem_tru_high,
          diem_tru_low = EXCLUDED.diem_tru_low,
          tong_diem = EXCLUDED.tong_diem,
          xep_hang = EXCLUDED.xep_hang,
          trang_thai = EXCLUDED.trang_thai,
          ghi_chu = EXCLUDED.ghi_chu,
          updated_at = NOW();
  $sql$;

  EXECUTE $sql$
    INSERT INTO appeals (
      id, tournament_id, loai, team_id, noi_dung, match_id, performance_id,
      trang_thai, nguoi_gui, thoi_gian_gui, nguoi_xu_ly, ket_luan, thoi_gian_xu_ly, attachments
    )
    VALUES (
      'fffffff1-0000-0000-0000-000000000001',
      '11111111-1111-1111-1111-111111111111',
      'khieu_nai',
      '55555555-5555-5555-5555-555555555552',
      'De nghi xem lai diem ky thuat',
      NULL,
      'eeeeeee1-0000-0000-0000-000000000001',
      'dang_xu_ly',
      'Tran Tuan Anh',
      NOW(),
      NULL,
      NULL,
      NULL,
      '[]'::jsonb
    )
    ON CONFLICT (id) DO UPDATE
      SET tournament_id = EXCLUDED.tournament_id,
          loai = EXCLUDED.loai,
          team_id = EXCLUDED.team_id,
          noi_dung = EXCLUDED.noi_dung,
          match_id = EXCLUDED.match_id,
          performance_id = EXCLUDED.performance_id,
          trang_thai = EXCLUDED.trang_thai,
          nguoi_gui = EXCLUDED.nguoi_gui,
          thoi_gian_gui = EXCLUDED.thoi_gian_gui,
          nguoi_xu_ly = EXCLUDED.nguoi_xu_ly,
          ket_luan = EXCLUDED.ket_luan,
          thoi_gian_xu_ly = EXCLUDED.thoi_gian_xu_ly,
          attachments = EXCLUDED.attachments,
          updated_at = NOW();
  $sql$;

  EXECUTE $sql$
    INSERT INTO notifications (
      id, tournament_id, user_id, type, title, body, data, is_read
    )
    VALUES (
      '12121212-0000-0000-0000-000000000001',
      '11111111-1111-1111-1111-111111111111',
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
      'system',
      'Khoi tao du lieu demo',
      'Du lieu demo da duoc nap thanh cong.',
      '{"scope":"demo"}'::jsonb,
      false
    )
    ON CONFLICT (id) DO UPDATE
      SET tournament_id = EXCLUDED.tournament_id,
          user_id = EXCLUDED.user_id,
          type = EXCLUDED.type,
          title = EXCLUDED.title,
          body = EXCLUDED.body,
          data = EXCLUDED.data,
          is_read = EXCLUDED.is_read;
  $sql$;
END
$seed$;

COMMIT;
