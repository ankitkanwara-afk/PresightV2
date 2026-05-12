# SuperAgent Instructions - Phase 1

## Objective
Keep this app minimal and focused on monthly presales impact reporting.

## Build Scope
- Reflect ingested activity data in UI.
- Make "SuperAgent Feed" the primary table.
- Keep "SFDC Wins/Losses" as the top business report block.
- Allow manual activity logging via button + modal (not inline persistent form).
- Show monthly KPI cards:
  - Total Activities
  - SFDC Linked %
  - No Opportunity Count
  - Wins
  - SOW Linked
  - Losses
- Show no-opportunity list report.

## Keep
- SFDC opportunity fields.
- `crmLinkStatus` enum.
- `presalesRegionId` and `salesRegionId`.
- Roles: Admin, Presales, Sales.

## Remove / Do Not Add
- Pricing calculator.
- Sandbox access.
- Suggestions/bugs module.
- Confidence score UX.
- Unresolved queue/status.
- Project health/sfdc compliance heavy modules.

## Data Contract (Phase 1)
Required fields for create:
- `date`
- `ownerUserId`
- `category`
- `activityType`
- `summary`

Important optional fields:
- `accountName`
- `sfdcOpportunityId`
- `sfdcOpportunityLink`
- `crmLinkStatus`
- `dealOutcome` (`open|win|loss`)
- `sowLinked`, `sowLink`
- `presalesRegionId`, `salesRegionId`
- `reviewStatus`

## Ingestion Guidance
App is not orchestration engine in MVP.
It accepts normalized payloads.
Use `externalFingerprint` for idempotent upsert in backend phase.

