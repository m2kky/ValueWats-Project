# Google Sheets Sources Design

## Goal

Allow an agent to use one or more configured Google Sheets ranges as read-only reference sources. Each source describes what it contains and when the agent should consult it. Google Sheets is not treated as a Store replacement or as a global source of truth.

## Current State

The project already has:

- Google OAuth integrations and encrypted credentials.
- A `read_sheet_data` tool handler that waits for Google Sheets and returns rows.
- Tenant-scoped integration lookup.
- A shared model tool loop that feeds tool results back to the model before the final response.

The missing pieces are:

- A canonical Google Sheets read capability in the agent setup lifecycle.
- Persistence and validation of configured sheet sources.
- Agent editor controls for source configuration.
- Tools that constrain the model to configured spreadsheets and ranges instead of accepting arbitrary IDs.

## Scope

This change is read-only. It does not create spreadsheets, append rows, modify cells, synchronize Salla, or treat sheet cell content as executable system instructions.

## Agent Configuration

Add one canonical capability named `google_sheets_read`. It references one active Google Sheets integration and stores multiple sources in its configuration.

Each source contains:

- `id`: stable server-generated identifier.
- `name`: human-readable source name.
- `spreadsheetId`: fixed spreadsheet identifier.
- `range`: fixed A1 range.
- `purpose`: description of the data in the source.
- `useWhen`: agent-authored guidance describing when to consult it.
- `priority`: relative precedence when several sheet sources apply.

The capability-level `instructions` field remains editable from the agent settings page. Business behavior is not hardcoded in the runtime.

The first version supports multiple sources under one Google connection per agent. Multiple Google accounts for one agent are out of scope.

## Runtime Tools

Expose two read-only tools when the capability is enabled:

### `list_google_sheet_sources`

Returns configured source IDs, names, purposes, usage guidance, and priorities. It returns no credentials, spreadsheet IDs, or unrestricted ranges.

### `query_google_sheet_source`

Accepts:

- `sourceId`: one configured source.
- `query`: optional text used to match rows.
- `page`: optional positive page number.

The server resolves the spreadsheet and range from configuration, reads Google Sheets, sanitizes the values, and returns at most 20 rows per page. The response states whether more matching rows remain. The model cannot supply or override a spreadsheet ID, range, tenant ID, or integration ID.

Tool execution remains synchronous inside the existing model tool loop:

1. The model selects a configured source.
2. The server reads and waits for Google Sheets.
3. The sanitized result is appended as a tool message.
4. The model creates the customer-facing response.

## Trust Boundary

- `purpose`, `useWhen`, and capability instructions are trusted agent configuration authored in the settings page.
- Sheet cells are reference data, not system instructions.
- Cell text cannot grant permissions, enable actions, select another integration, or override agent/system rules.
- Existing server-owned security and tool authorization constraints remain in code.

## Failure Behavior

- Inactive or cross-tenant integrations fail closed.
- Unknown source IDs fail before any Google API call.
- Google timeout, authorization, and quota failures return a bounded tool error without credentials or provider payloads.
- The model follows fallback behavior defined in the agent's settings. The runtime does not assume that Store, Knowledge, or another sheet should be used instead.

## Editor Experience

Add a `Google Sheets Sources` action card to the agent editor:

- Enable/disable read access.
- Select one active Google Sheets connection.
- Add, edit, reorder, and remove sources.
- Configure name, spreadsheet URL/ID, range, purpose, and usage guidance.
- Prevent save/publish when enabled without a connection or valid source.

The UI sends this through the canonical capability endpoint. It does not write legacy `actionConfig` directly.

## Validation Limits

- 1 to 20 sources per agent.
- Source name: 1 to 120 characters.
- Purpose and usage guidance: up to 500 characters each.
- Range: valid bounded A1 notation, up to 200 characters.
- Spreadsheet ID: validated server-side and never accepted from a model tool call.
- Maximum 5,000 source rows read per query and 20 rows returned per page.
- Maximum cell length and response size are bounded before model injection.

## Testing

- Canonical capability create/update/disable and config-version checks.
- Tenant and integration authorization.
- Strict tool schemas with no infrastructure identifiers.
- Source selection, filtering, pagination, sanitization, and response limits.
- Google timeout and credential redaction.
- Agent tool-loop behavior proving the model receives the sheet result before replying.
- Agent editor payload and validation tests.
- Regression coverage for existing Store and terminal capabilities.

## Acceptance Criteria

- An admin can configure multiple named sheet sources for one agent.
- The model can discover and query only those sources.
- The model receives rows before producing its final response.
- Source purpose and usage behavior come from agent settings.
- Sheet contents cannot act as system instructions or expand permissions.
- No Google Sheets write tool is exposed by this capability.
- Existing Store behavior remains unchanged.
