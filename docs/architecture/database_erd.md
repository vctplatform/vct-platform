# VCT Platform — Database ERD & Schema Overview

> **381 bảng** · **11 schemas** · **1,319 foreign keys** · PostgreSQL trên Supabase

---

## Tổng quan Schemas

| Schema | Số bảng | Mô tả |
|--------|---------|-------|
| `public` | 88 | Nghiệp vụ giải đấu chính (VĐV, trận đấu, đăng ký, kết quả) |
| `core` | 34 | Identity & multi-tenancy (users, roles, tenants, approval) |
| `system` | 126 | Hạ tầng nội bộ (audit log, jobs, feature flags, notifications, A/B testing) |
| `platform` | 31 | Tài chính, cộng đồng, di sản, marketplace |
| `tournament` | 29 | Event sourcing & scoring nâng cao |
| `training` | 12 | Đào tạo, kỹ thuật, đai, chương trình giảng dạy |
| `people` | 6 | Câu lạc bộ chi nhánh, thành viên, chứng chỉ |
| `temporal` | 4 | Temporal history tracking |
| `archive` | 10 | Lưu trữ dữ liệu theo quý |
| `ml` | 6 | Machine Learning (model registry, predictions) |
| `api_v1` | — | Views phục vụ API (không phải base tables) |

---

## 1. Core Identity & Multi-Tenancy

```mermaid
erDiagram
    core_tenants {
        uuid id PK
        varchar name
        varchar slug
        uuid parent_id FK
        varchar status
        jsonb settings
    }
    core_users {
        uuid id PK
        uuid tenant_id FK
        varchar username
        varchar password_hash
        varchar full_name
        varchar email
        varchar phone
        boolean is_active
    }
    core_roles {
        uuid id PK
        uuid tenant_id FK
        varchar name
        varchar description
    }
    core_permissions {
        uuid id PK
        varchar resource
        varchar action
    }
    core_role_permissions {
        uuid role_id FK
        uuid permission_id FK
        uuid tenant_id FK
    }
    core_user_roles {
        uuid user_id FK
        uuid role_id FK
        uuid tenant_id FK
        uuid granted_by FK
    }
    core_sessions {
        uuid id PK
        uuid user_id FK
        uuid tenant_id FK
        text token
        timestamptz expires_at
    }

    core_tenants ||--o{ core_users : "tenant_id"
    core_tenants ||--o{ core_roles : "tenant_id"
    core_tenants ||--o| core_tenants : "parent_id"
    core_users ||--o{ core_user_roles : "user_id"
    core_roles ||--o{ core_user_roles : "role_id"
    core_roles ||--o{ core_role_permissions : "role_id"
    core_permissions ||--o{ core_role_permissions : "permission_id"
    core_users ||--o{ core_sessions : "user_id"
```

---

## 2. Giải đấu (Tournament Core)

```mermaid
erDiagram
    tournaments {
        uuid id PK
        uuid tenant_id FK
        varchar name
        varchar code
        varchar status
        date start_date
        date end_date
        text location
        jsonb config
    }
    teams {
        uuid id PK
        uuid tenant_id FK
        uuid tournament_id FK
        varchar name
        varchar province
    }
    athletes {
        uuid id PK
        uuid tenant_id FK
        uuid tournament_id FK
        uuid team_id FK
        varchar full_name
        date date_of_birth
        varchar gender
        numeric weight
    }
    arenas {
        uuid id PK
        uuid tenant_id FK
        uuid tournament_id FK
        varchar name
        integer capacity
    }
    age_groups {
        uuid id PK
        uuid tournament_id FK
        varchar name
        integer min_age
        integer max_age
    }
    weight_classes {
        uuid id PK
        uuid tournament_id FK
        uuid lua_tuoi_id FK
        varchar name
        numeric min_weight
        numeric max_weight
    }
    content_categories {
        uuid id PK
        uuid tournament_id FK
        uuid lua_tuoi_id FK
        varchar name
        varchar type
    }
    registrations {
        uuid id PK
        uuid tournament_id FK
        uuid athlete_id FK
        uuid content_category_id FK
        uuid weight_class_id FK
        varchar status
    }

    tournaments ||--o{ teams : "tournament_id"
    tournaments ||--o{ athletes : "tournament_id"
    tournaments ||--o{ arenas : "tournament_id"
    tournaments ||--o{ age_groups : "tournament_id"
    tournaments ||--o{ weight_classes : "tournament_id"
    tournaments ||--o{ content_categories : "tournament_id"
    tournaments ||--o{ registrations : "tournament_id"
    teams ||--o{ athletes : "team_id"
    athletes ||--o{ registrations : "athlete_id"
    age_groups ||--o{ weight_classes : "lua_tuoi_id"
    content_categories }o--|| age_groups : "lua_tuoi_id"
```

---

## 3. Thi đấu & Chấm điểm

```mermaid
erDiagram
    combat_matches {
        uuid id PK
        uuid tournament_id FK
        uuid content_category_id FK
        uuid weight_class_id FK
        uuid arena_id FK
        uuid athlete_red_id FK
        uuid athlete_blue_id FK
        uuid nguoi_thang_id FK
        varchar round
        integer match_number
        varchar status
    }
    form_performances {
        uuid id PK
        uuid tournament_id FK
        uuid content_category_id FK
        uuid arena_id FK
        uuid athlete_id FK
        varchar status
        numeric total_score
    }
    judge_scores {
        uuid id PK
        uuid tournament_id FK
        uuid referee_id FK
        uuid athlete_id FK
        numeric score
    }
    referees {
        uuid id PK
        uuid tournament_id FK
        uuid user_id FK
        varchar name
        varchar level
    }
    referee_assignments {
        uuid id PK
        uuid tournament_id FK
        uuid referee_id FK
        uuid arena_id FK
        varchar role
    }
    match_events {
        uuid id PK
        uuid recorded_by FK
        varchar event_type
        jsonb event_data
    }
    results {
        uuid id PK
        uuid tournament_id FK
        uuid content_category_id FK
        uuid athlete_id FK
        uuid team_id FK
        varchar medal
    }
    schedule_entries {
        uuid id PK
        uuid tournament_id FK
        uuid arena_id FK
        uuid content_category_id FK
        timestamptz start_time
        timestamptz end_time
    }

    tournaments ||--o{ combat_matches : "tournament_id"
    tournaments ||--o{ form_performances : "tournament_id"
    tournaments ||--o{ referees : "tournament_id"
    combat_matches }o--|| athletes : "athlete_red_id"
    combat_matches }o--|| athletes : "athlete_blue_id"
    combat_matches }o--o| athletes : "nguoi_thang_id"
    combat_matches }o--o| arenas : "arena_id"
    combat_matches }o--o| content_categories : "content_category_id"
    combat_matches }o--o| weight_classes : "weight_class_id"
    form_performances }o--|| athletes : "athlete_id"
    form_performances }o--o| arenas : "arena_id"
    referees }o--o| core_users : "user_id"
    referee_assignments }o--|| referees : "referee_id"
    referee_assignments }o--o| arenas : "arena_id"
    judge_scores }o--o| referees : "referee_id"
    judge_scores }o--|| athletes : "athlete_id"
    results }o--o| athletes : "athlete_id"
    results }o--o| teams : "team_id"
```

---

## 4. BTC (Ban Tổ Chức) — Quản lý giải

```mermaid
erDiagram
    btc_members {
        uuid id PK
        uuid tournament_id FK
        varchar ho_ten
        varchar chuc_vu
    }
    btc_assignments {
        uuid id PK
        uuid tournament_id FK
        varchar noi_dung
    }
    btc_draws {
        uuid id PK
        uuid tournament_id FK
        jsonb draw_data
    }
    btc_weigh_ins {
        uuid id PK
        uuid tournament_id FK
        numeric can_nang
    }
    btc_meetings {
        uuid id PK
        uuid tournament_id FK
        text noi_dung
    }
    btc_protests {
        uuid id PK
        uuid tournament_id FK
        text ly_do
    }
    btc_finance {
        uuid id PK
        uuid tournament_id FK
        numeric so_tien
    }
    btc_content_results {
        uuid id PK
        uuid tournament_id FK
    }
    btc_team_results {
        uuid id PK
        uuid tournament_id FK
    }

    tournaments ||--o{ btc_members : "tournament_id"
    tournaments ||--o{ btc_assignments : "tournament_id"
    tournaments ||--o{ btc_draws : "tournament_id"
    tournaments ||--o{ btc_weigh_ins : "tournament_id"
    tournaments ||--o{ btc_meetings : "tournament_id"
    tournaments ||--o{ btc_protests : "tournament_id"
    tournaments ||--o{ btc_finance : "tournament_id"
    tournaments ||--o{ btc_content_results : "tournament_id"
    tournaments ||--o{ btc_team_results : "tournament_id"
```

---

## 5. Liên đoàn & Tổ chức

```mermaid
erDiagram
    federations {
        uuid id PK
        uuid tenant_id FK
        uuid parent_id FK
        varchar name
        varchar level
    }
    federation_units {
        uuid id PK
        uuid parent_id FK
        uuid province_id FK
        varchar name
        varchar unit_type
    }
    federation_personnel {
        uuid id PK
        uuid unit_id FK
        varchar name
        varchar position
    }
    federation_provinces {
        uuid id PK
        varchar name
        varchar code
    }
    federation_organizations {
        uuid id PK
        uuid province_id FK
        varchar name
    }
    clubs {
        uuid id PK
        uuid tenant_id FK
        uuid federation_id FK
        varchar name
    }
    provinces {
        uuid id PK
        varchar name
    }
    provincial_associations {
        uuid id PK
        uuid province_id FK
        varchar name
    }
    provincial_clubs {
        uuid id PK
        uuid association_id FK
        uuid province_id FK
        varchar name
    }

    federations ||--o| federations : "parent_id"
    federations ||--o{ clubs : "federation_id"
    federation_units ||--o| federation_units : "parent_id"
    federation_units ||--o{ federation_personnel : "unit_id"
    federation_provinces ||--o{ federation_units : "province_id"
    federation_provinces ||--o{ federation_organizations : "province_id"
    provinces ||--o{ provincial_associations : "province_id"
    provincial_associations ||--o{ provincial_clubs : "association_id"
```

---

## 6. Platform Services

```mermaid
erDiagram
    platform_subscriptions {
        uuid id PK
        uuid tenant_id FK
        uuid plan_id FK
        varchar status
    }
    platform_subscription_plans {
        uuid id PK
        uuid tenant_id FK
        varchar name
        numeric price
    }
    platform_invoices {
        uuid id PK
        uuid tenant_id FK
        numeric total
    }
    platform_payments {
        uuid id PK
        uuid tenant_id FK
        uuid payer_user_id FK
        numeric amount
    }
    platform_posts {
        uuid id PK
        uuid tenant_id FK
        uuid author_id FK
        text content
    }
    platform_comments {
        uuid id PK
        uuid tenant_id FK
        uuid author_id FK
        text body
    }
    platform_marketplace_listings {
        uuid id PK
        uuid tenant_id FK
        uuid seller_id FK
        varchar title
        numeric price
    }
    platform_martial_schools {
        uuid id PK
        uuid tenant_id FK
        varchar name
        varchar founder
    }
    platform_heritage_techniques {
        uuid id PK
        uuid tenant_id FK
        varchar name
        text description
    }

    core_users ||--o{ platform_posts : "author_id"
    core_users ||--o{ platform_comments : "author_id"
    core_users ||--o{ platform_marketplace_listings : "seller_id"
    core_users ||--o{ platform_payments : "payer_user_id"
    core_tenants ||--o{ platform_subscriptions : "tenant_id"
    core_tenants ||--o{ platform_invoices : "tenant_id"
```

---

## 7. Training & Heritage

```mermaid
erDiagram
    training_techniques {
        uuid id PK
        varchar name
        varchar category
        text description
    }
    training_curricula {
        uuid id PK
        varchar name
        varchar level
    }
    training_courses {
        uuid id PK
        varchar name
        uuid curriculum_id
    }
    training_sessions {
        uuid id PK
        uuid course_id
        date session_date
    }
    training_belt_examinations {
        uuid id PK
        varchar belt_level
        date exam_date
    }
    training_belt_exam_results {
        uuid id PK
        uuid examination_id
        varchar result
    }

    training_curricula ||--o{ training_courses : "curriculum_id"
    training_courses ||--o{ training_sessions : "course_id"
    training_belt_examinations ||--o{ training_belt_exam_results : "examination_id"
```

---

## 8. System Infrastructure

```mermaid
erDiagram
    system_feature_flags {
        uuid id PK
        uuid tenant_id FK
        varchar key
        boolean enabled
    }
    system_background_jobs {
        uuid id PK
        uuid tenant_id FK
        uuid created_by FK
        varchar job_type
        varchar status
    }
    system_api_keys {
        uuid id PK
        uuid tenant_id FK
        uuid created_by FK
        varchar key_hash
    }
    system_configurations {
        uuid id PK
        uuid tenant_id FK
        varchar key
        jsonb value
    }
    system_webhooks {
        uuid id PK
        varchar url
        varchar events
    }
    system_experiments {
        uuid id PK
        varchar name
        varchar status
        integer rollout_pct
    }
    system_import_jobs {
        uuid id PK
        uuid tenant_id FK
        uuid imported_by FK
        varchar status
    }
    system_export_jobs {
        uuid id PK
        uuid tenant_id FK
        uuid exported_by FK
        varchar format
    }

    core_tenants ||--o{ system_feature_flags : "tenant_id"
    core_tenants ||--o{ system_configurations : "tenant_id"
    core_users ||--o{ system_background_jobs : "created_by"
    core_users ||--o{ system_api_keys : "created_by"
    core_users ||--o{ system_import_jobs : "imported_by"
    core_users ||--o{ system_export_jobs : "exported_by"
```

---

## 9. Sơ đồ tổng quan liên kết giữa các Schema

```mermaid
graph TB
    subgraph "core"
        T[tenants]
        U[users]
        R[roles]
    end

    subgraph "public — Tournament"
        TN[tournaments]
        TM[teams]
        AT[athletes]
        CM[combat_matches]
        FP[form_performances]
        RF[referees]
        RG[registrations]
        AR[arenas]
    end

    subgraph "platform"
        SB[subscriptions]
        PS[posts]
        MK[marketplace]
        MS[martial_schools]
    end

    subgraph "system"
        FF[feature_flags]
        BJ[background_jobs]
        AK[api_keys]
    end

    subgraph "training"
        TC[techniques]
        CR[curricula]
        BE[belt_exams]
    end

    subgraph "tournament — Event Sourcing"
        ES[event_store]
        ME[match_events]
        RA[athlete_ratings]
    end

    T -->|tenant_id| U
    T -->|tenant_id| TN
    T -->|tenant_id| SB
    T -->|tenant_id| FF

    U -->|user_id| RF
    U -->|author_id| PS
    U -->|created_by| BJ
    U -->|created_by| AK

    TN -->|tournament_id| TM
    TN -->|tournament_id| AT
    TN -->|tournament_id| CM
    TN -->|tournament_id| FP
    TN -->|tournament_id| RG
    TN -->|tournament_id| AR

    TM -->|team_id| AT
    AT -->|athlete_id| CM
    AT -->|athlete_id| RG
```

---

## Thống kê Foreign Keys theo Schema

| Schema | Unique FKs | Ghi chú |
|--------|-----------|---------|
| `core` | 31 | Chủ yếu liên kết tenants ↔ users ↔ roles |
| `public` | 89 | Trung tâm nghiệp vụ: tournaments là hub chính |
| `platform` | 35 | Liên kết core.users + core.tenants |
| `system` | 40+ | Nhiều partitioned tables tạo FKs trùng lặp |
| `people` | 6 | Đều FK tới core.tenants |
| `training` | 0 | Chưa có FK (tự quản lý) |
| `ml` | 3 | predictions → model_registry |

> **Lưu ý**: Tổng 1,319 FK bao gồm nhiều bản sao từ các **partitioned tables** (mỗi partition kế thừa FK của bảng cha). Số FK thực tế unique khoảng ~160.
