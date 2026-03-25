-- ═══════════════════════════════════════════════════════════════
-- VCT PLATFORM — FEDERATION WORKFLOW DEFINITIONS
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS federation_workflow_definitions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code            VARCHAR(100) NOT NULL UNIQUE,
    name            TEXT NOT NULL,
    description     TEXT NOT NULL DEFAULT '',
    category        VARCHAR(50) NOT NULL DEFAULT '',
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS federation_workflow_steps (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id     UUID NOT NULL REFERENCES federation_workflow_definitions(id) ON DELETE CASCADE,
    step_order      INTEGER NOT NULL,
    name            TEXT NOT NULL,
    description     TEXT NOT NULL DEFAULT '',
    role_code       VARCHAR(100) NOT NULL DEFAULT '',
    auto_approve    BOOLEAN NOT NULL DEFAULT false,
    UNIQUE (workflow_id, step_order)
);

CREATE INDEX idx_fed_wf_active ON federation_workflow_definitions(is_active);
CREATE INDEX idx_fed_wf_steps_wf ON federation_workflow_steps(workflow_id);

-- Seed workflows
INSERT INTO federation_workflow_definitions (code, name, description, category) VALUES
('club_registration',    'Đăng ký CLB mới',       'Quy trình phê duyệt thành lập CLB Võ Cổ Truyền',         'CLB'),
('belt_promotion',       'Thi thăng đai',         'Quy trình xét duyệt kết quả thi đai từ CLB → Tỉnh → LĐ', 'Đai'),
('coach_cert',           'Cấp chứng chỉ HLV',    'Quy trình xét duyệt và cấp chứng chỉ huấn luyện viên',   'HLV'),
('referee_cert',         'Cấp thẻ Trọng tài',    'Quy trình đào tạo và cấp thẻ trọng tài quốc gia',        'Trọng tài'),
('tournament_approval',  'Phê duyệt Giải đấu',   'Quy trình phê duyệt tổ chức giải đấu cấp tỉnh/quốc gia', 'Giải đấu'),
('discipline_case',      'Xử lý Kỷ luật',        'Quy trình điều tra, xét xử và ra quyết định kỷ luật',     'Kỷ luật'),
('document_publish',     'Ban hành Văn bản',      'Quy trình soạn thảo, duyệt và ban hành công văn',         'Văn bản')
ON CONFLICT (code) DO NOTHING;

-- Seed steps for club_registration
INSERT INTO federation_workflow_steps (workflow_id, step_order, name, role_code)
SELECT id, 1, 'Nộp hồ sơ', 'club_admin'         FROM federation_workflow_definitions WHERE code = 'club_registration'
UNION ALL
SELECT id, 2, 'Xét duyệt cấp tỉnh', 'provincial_admin'  FROM federation_workflow_definitions WHERE code = 'club_registration'
UNION ALL
SELECT id, 3, 'Phê duyệt liên đoàn', 'federation_secretary' FROM federation_workflow_definitions WHERE code = 'club_registration'
ON CONFLICT DO NOTHING;

-- Seed steps for belt_promotion
INSERT INTO federation_workflow_steps (workflow_id, step_order, name, role_code)
SELECT id, 1, 'CLB đề nghị', 'club_admin'           FROM federation_workflow_definitions WHERE code = 'belt_promotion'
UNION ALL
SELECT id, 2, 'Hội đồng thi', 'national_referee'    FROM federation_workflow_definitions WHERE code = 'belt_promotion'
UNION ALL
SELECT id, 3, 'Xác nhận tỉnh', 'provincial_admin'   FROM federation_workflow_definitions WHERE code = 'belt_promotion'
UNION ALL
SELECT id, 4, 'Phê duyệt LĐ', 'federation_president' FROM federation_workflow_definitions WHERE code = 'belt_promotion'
ON CONFLICT DO NOTHING;

-- Seed steps for tournament_approval
INSERT INTO federation_workflow_steps (workflow_id, step_order, name, role_code)
SELECT id, 1, 'Nộp kế hoạch', 'provincial_admin'    FROM federation_workflow_definitions WHERE code = 'tournament_approval'
UNION ALL
SELECT id, 2, 'Rà soát kỹ thuật', 'national_referee'FROM federation_workflow_definitions WHERE code = 'tournament_approval'
UNION ALL
SELECT id, 3, 'Xét duyệt', 'federation_secretary'   FROM federation_workflow_definitions WHERE code = 'tournament_approval'
UNION ALL
SELECT id, 4, 'Phê duyệt', 'federation_president'   FROM federation_workflow_definitions WHERE code = 'tournament_approval'
ON CONFLICT DO NOTHING;
