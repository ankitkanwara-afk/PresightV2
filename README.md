# PreSight Activity Workspace v2 (Local)

Simple, UI-first MVP for presales activity updates and monthly impact visibility.

## Run locally

```bash
npm install
npm start
```

Open: `http://localhost:3001`

## Phase 1 architecture

- **Frontend UI** (`public/index.html`, `public/styles.css`, `public/app.js`)
  - Unified activity table (manual + SuperAgent rows)
  - Description-first add/edit modal
  - Commit / reject / delete actions
  - Monthly counters + SFDC wins/losses block
- **Backend API** (`server.js`)
  - SuperAgent ingest endpoint with idempotent upsert
  - Activities CRUD + commit/reject actions
  - Taxonomy/config endpoint
  - Wins/losses report endpoint
- **Storage (Phase 1 mock)** (`data/activities.json`)
  - JSON file persistence for API data
  - Safe for local demo only (replace with DB in Phase 2)

## REST API for SuperAgent and UI

### Health and config

- `GET /api/health`
- `GET /api/config/taxonomies`

### Activities

- `GET /api/activities?month=YYYY-MM&ownerUserId=...&commitStatus=...`
- `POST /api/activities`
- `PATCH /api/activities/:id`
- `PATCH /api/activities/:id/commit`
- `POST /api/activities/:id/reject`
- `DELETE /api/activities/:id`

### Reports

- `GET /api/reports/wins-losses?month=YYYY-MM&ownerUserId=...`

### SuperAgent ingest

- `POST /api/superagent/ingest-batch`
  - Supports `dryRun: true`
  - Uses `externalFingerprint` as strict idempotency key (upsert)
  - Enforces one lead per `meetingKey` (FCFS)
  - Flags SFDC rep mismatch conflicts (`sfdcConflictReason`)

Example:

```json
{
  "ingestBatchId": "batch-2026-05-11-01",
  "dryRun": false,
  "records": [
    {
      "meetingKey": "evt-acme-2026-05-11",
      "date": "2026-05-11",
      "ownerUserId": "u-presales-1",
      "sourceType": "superagent",
      "category": "external",
      "activityTypeId": "at_customer_call",
      "callTypeId": "ct_discovery",
      "summary": "Discovery call held with support leadership.",
      "externalFingerprint": "evt-acme-2026-05-11-u-presales-1"
    }
  ]
}
```

## Notes

- Phase 1 is presales-focused, local/demo-ready, and ingest-ready.
- No raw source connectors or micro-agent runtime are implemented in this app.
- For production, replace JSON file storage with PostgreSQL and add authentication.
