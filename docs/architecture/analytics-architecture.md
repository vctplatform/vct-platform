# VCT Platform Business Analytics & Telemetry Architecture

This document establishes the unbreakable rules for tracking user behavior, gathering business intelligence, and calculating systemic metrics (like ELO ranking) within the VCT Platform. The primary objective is to maintain absolute observability over business success without degrading operational database performance.

## 1. Telemetry Separation (PostHog / Mixpanel)
- **Zero-DB Telemetry**: Pure behavioral tracking events (e.g., `Page_Viewed`, `Button_Clicked`, `Filter_Applied`) are STRICTLY BANNED from being written to the core PostgreSQL database.
- **Dedicated Observability**: All behavioral and funnel tracking must be sent exclusively to the designated external observability platform (e.g., PostHog) via asynchronous batching.
- **Anonymization law (GDPR/PDPA)**: Real names and cleartext emails MUST NOT be sent as metadata in telemetry events. Users must be identified solely via their internal `AthleteID` or generic `UUIDs`.

## 2. Domain Events vs Analytics Events
- **Domain Event Publication**: Core state transitions (e.g., `Match_Scored`, `Tournament_Ended`, `Athlete_Registered`) are crucial business facts. These MUST be published to the internal Event Bus (NATS) and stored permanently using an Event Sourcing pattern.
- **Event Enrichment**: Domain events sent to telemetry tools must be enriched with business context (e.g., sending `Tournament_Ended` to PostHog must include the total participant count as a property).

## 3. OLTP vs OLAP Separation (Queries)
- **Primary Database Protection**: Complex administrative reporting, statistical aggregations (e.g., "Monthly Growth Rate", "Demographic Breakdowns"), and heavy `GROUP BY` dashboard queries are BANNED from running on the Primary Write Database (OLTP).
- **Read-Replica BI**: All Business Intelligence (BI) dashboards MUST direct their queries to PostgreSQL Read-Replicas.
- **Materialized Views**: Highly complex multi-table aggregations must be computed asynchronously via Cron jobs into `Materialized Views` during off-peak hours (e.g., 3:00 AM) to ensure the Admin Portal loads charts instantly.

## 4. Ranking & Progression Algorithms (ELO/Glicko)
- **Mathematical Immutability**: Athlete progression and ranking updates must follow a strict, tested mathematical formula (e.g., ELO variant for martial arts) processed transactionally.
- **Audit Logging**: Every ELO mutation must record:
  1. The specific `Match_UUID` triggering the change.
  2. The `Previous_ELO` state.
  3. The `Delta_Variation` (points won/lost).
  4. The `New_ELO` state.
  This allows the system to completely rebuild or recalculate the entire global ranking history in case of judging errors or overturned results.

## 5. Key Performance Indicators (KPIs)
- **North Star Metric definitions**: The current platform North Star metric must be explicitly defined and tracked (e.g., "Active Competition Matches per Month").
- **Funnel Bottleneck Tracking**: UI flows for complex operations (like "Federation Onboarding" or "Tournament Setup") must track explicit "Step Started" and "Step Completed" events to isolate drop-off friction points.
