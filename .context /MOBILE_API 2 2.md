# API.md — Mobile (Employee) Module

> Scope: employee-facing mobile screens only, per `Mobile_Ui_Wireframe_Module.excalidraw`.
> The Manager-role screens present in that same wireframe file ("If Role
> (Manager)" — team device list, pending RM approvals) are **excluded** —
> those belong to a separate Manager/Web module doc.
>
> All endpoints are implicitly scoped to the authenticated user via session/
> JWT (`:userId`) — not passed as a request arg. All list endpoints support
> standard `limit`/`offset` pagination, omitted below for brevity.
>
> Base tables referenced: `user`, `item_category`, `item`, `request`,
> `extension_request`, `support_request`, `handover_request`, `device_log`
> (from `schema_v3.dbml`). Every write to a business table is paired with a
> `device_log` insert, per `WORKFLOWS.md` §10–11.

---

## Format

// success
{
"status_code": 200,
"data": {...},
"message": "...",
"meta": { "timestamp": "...", "request_id": "..." } ,
"success": true,
}

// error
{
"status_code": 400,
"message": "...",
"error": { "code": "...", "message": "...", "details": [...] },
"meta": {...},
"success": false,
}

## Screen 1 — My Devices (List)

Wireframe: _"User Assigned list of devices"_

### Get My Devices

- **Endpoint:** `GET /me/devices`
- **Method:** GET
- **Request Args:** none
- **Response:** `[request]`
- **Backend Logic:** `request WHERE requester_id = :userId`.

---

## Screen 2 — Device Detail

Wireframe: _"item details" / "Requested Item Info" / "Item specific info which is assigned" / QR Code_

### Get Device Detail

- **Endpoint:** `GET /me/devices/{itemId}`
- **Method:** GET
- **Request Args:** `itemId` (path)
- **Response:** `request`, `handover_request`
- **Backend Logic:** Fetch `request` WHERE `requester_id = :userId` AND `assigned_item_id = :itemId`. Return 404 if no matching active assignment exists. Fetch all `handover_request` WHERE `item_id = :itemId`, ordered by `created_at DESC`.

This screen is the entry point to Support, Extend, Return, and Handover actions below.

---

## Screen 3 — Request Device (Create)

Wireframe: _"Request form" → select item to request → duration/date → Priority → mention RM → Send Request_

### Create Request

- **Endpoint:** `POST /me/requests`
- **Method:** POST
- **Request Args:** `request`
- **Response:** `request`
- **Backend Logic:**
    - Validate requester and populate system-controlled fields.
    - Read `item_category` to determine manager approval requirement and snapshot it into the `request`.
    - Populate `requester_id` and `manager_id` from the authenticated user.
    - Set initial `request.status` and `mgr_approval_status` based on `requires_mgr_approval`.
    - Ignore any client-provided system-managed fields (IDs, approvals, assignment, completion, timestamps, etc.).
    - Persist the `request`. No `device_log` entry is created since no physical device has been assigned yet.

---

## Screen 4 — My Requests (List + Detail)

Wireframe: _"Request & Item info" / "Request Info" / "Duration, Priority etc."_

### List Pending Approvals (Manager)

- **Endpoint:** `GET /manager/approvals`
- **Method:** GET
- **Request Args:** none
- **Response:** `request.*` + `item_category.name` + requester `name` from `user`
- **Backend Logic:** `request WHERE manager_id = :userId AND requires_mgr_approval = true AND mgr_approval_status = 'pending' AND status = 'pending_mgr_approval' ORDER BY created_at ASC`. All three conditions required — `requires_mgr_approval = true` confirms sign-off is needed, `mgr_approval_status = 'pending'` means the manager hasn't acted, `status = 'pending_mgr_approval'` means it is actively awaiting the manager and hasn't moved on. `manager_id` is snapshotted from `user.manager_id` at request creation, so `:userId` from JWT automatically scopes to this manager's direct reports only.

### Approve Request

- **Endpoint:** `PATCH /manager/requests/{requestId}/approve`
- **Method:** PATCH
- **Request Args:** `{ manager_decision_note }` (optional)
- **Response:** `request.*`
- **Backend Logic:** Validate `request.manager_id = :userId`, `requires_mgr_approval = true`, `mgr_approval_status = 'pending'`, `status = 'pending_mgr_approval'`. Update `mgr_approval_status = 'approved'`, `manager_decided_at = now()`, `manager_decision_note`, `status = 'pending_it_approval'`.

### Reject Request

- **Endpoint:** `PATCH /manager/requests/{requestId}/reject`
- **Method:** PATCH
- **Request Args:** `{ rejected_reason, manager_decision_note }`
- **Response:** `request.*`
- **Backend Logic:** Validate `request.manager_id = :userId`, `requires_mgr_approval = true`, `mgr_approval_status = 'pending'`, `status = 'pending_mgr_approval'`. Update `mgr_approval_status = 'rejected'`, `status = 'rejected'`, `rejected_by = 'manager'`, `rejected_reason`, `manager_decision_note`, `manager_decided_at = now()`.

---

## Screen 5 — Extension Request (Create + View)

Wireframe: _"Extended Request"_ (action on Device Detail)

### Create Extension Request

- **Endpoint:** `POST /me/devices/{itemId}/extension-requests`
- **Method:** POST
- **Request Args:** `{ extended_to }`
- **Response:** `extension_request.*`
- **Backend Logic:**
    - Validate `item.current_owner_id = :userId`.
    - Resolve active `request` (`assigned_item_id = itemId`, `status = 'assigned'`); reject if none.
    - Validate `extended_to > request.assigned_to`.
    - Insert `extension_request`: `original_request_id = request.id`, `requester_id = :userId`, `current_assigned_to = request.assigned_to` (snapshot), `extended_to`, `status = 'pending'`, `requires_mgr_approval = request.requires_mgr_approval`, `manager_id = request.manager_id`, `mgr_approval_status = 'pending'` if `requires_mgr_approval = true` else `'not_required'`.
    - `device_log` insert: `event_type = 'extension_requested'`, `item_id = itemId`, `request_id`, `extension_request_id`, `actor_role = 'employee'`, `is_milestone = false`.

### List Extension Requests for a Device

- **Endpoint:** `GET /me/devices/{itemId}/extension-requests`
- **Method:** GET
- **Request Args:** `itemId` (path)
- **Response:** `extension_request.*`
- **Backend Logic:** Resolve active `request.id` where `assigned_item_id = :itemId AND requester_id = :userId`. Then `extension_request WHERE original_request_id = :resolvedRequestId ORDER BY created_at DESC`. Rows are permanent (`PROJECT.md` Rule 2) so this covers full extension history on that device for this employee.

### Get Extension Request Detail

- **Endpoint:** `GET /me/extension-requests/{id}`
- **Method:** GET
- **Request Args:** `id` (path)
- **Response:** `{ id, status, current_assigned_to, extended_to, mgr_approval_status, manager_decision_note, it_note, created_at }`
- **Backend Logic:** Validate `extension_request.requester_id = :userId`.

---

## Screen 6 — Return Device (Create)

Wireframe: _"Return device"_ (action on Device Detail) + _"If (is_wfh flag) → Shipping url for tracking"_

Per `WORKFLOWS.md` §8: **on-site returns are IT-initiated only.** This endpoint is only usable when the active request's `is_wfh = true`; for non-WFH assignments the employee cannot initiate a return from mobile at all.

### Initiate WFH Return

- **Endpoint:** `POST /me/devices/{itemId}/return`
- **Method:** POST
- **Request Args:** `{ return_tracking_url }`
- **Response:** `item.*` + `request.*`
- **Backend Logic:**
    - Validate `item.current_owner_id = :userId`.
    - Resolve active `request` (`assigned_item_id = itemId`, `status = 'assigned'`); reject if none.
    - Validate `request.is_wfh = true` — if false, reject: "Return for this device must be initiated by IT."
    - Validate `item.status = 'assigned'` — reject if already `return_shipping_pending`.
    - Update `item.status = 'return_shipping_pending'`.
    - Update `request.return_tracking_url = return_tracking_url`, `request.return_initiated_at = now()`. `request.status` stays `'assigned'` — transit window is tracked on `item.status` only; `request.status` moves to `'completed'` only when IT confirms physical receipt (IT Admin module, out of scope here).
    - `device_log` insert: `event_type = 'return_ship_initiated'`, `actor_role = 'employee'`, `item_id = itemId`, `request_id`, `from_value = 'assigned'`, `to_value = 'return_shipping_pending'`, `metadata = { return_tracking_url }`, `is_milestone = false`.

No separate status-check endpoint needed — Screen 2's Device Detail already returns `item.status` and `request.return_tracking_url`.

---

---

## Screen 7 — Support Request (Create + View)

Wireframe: _"Support Operation Type"_ (install software / repair / replace) + _"Description / Cabin location if offline / RustDesk ID if online"_

The schema's `support_type` enum is `update | damage | lost` only. UI labels map onto it: "install software" → `update`; "repair" and "replace" both → `damage` (the _resolution_ — repaired-in-place vs. swap — is an IT decision made when the ticket is worked, not something the employee selects; see `WORKFLOWS.md` §4). There is no separate online/offline field in the schema — the RustDesk ID or cabin location is captured as free text inside `description`.

### File Support Request

- **Endpoint:** `POST /me/devices/{itemId}/support-requests`
- **Method:** POST
- **Request Args:** `{ type, description }`
- **Response:** `support_request.*`
- **Backend Logic:**
    - Validate `item.current_owner_id = :userId`.
    - Resolve `request_id` from active `request` (`assigned_item_id = itemId`, `status = 'assigned'`) — null only for a client-direct device with no request row.
    - Insert `support_request`: `item_id = itemId`, `requester_id = :userId`, `request_id`, `type`, `description`, `status = 'open'`, `filed_at = now()`.
    - `device_log` insert: `event_type = 'support_opened'`, `actor_role = 'employee'`, `item_id = itemId`, `support_request_id`, `is_milestone = true`.

### List My Support Requests

- **Endpoint:** `GET /me/support-requests`
- **Method:** GET
- **Request Args:** `status` (optional filter)
- **Response:** `support_request.*` + `item.name`
- **Backend Logic:** `support_request WHERE requester_id = :userId [AND status = :status] ORDER BY filed_at DESC`.

### Get Support Request Detail

- **Endpoint:** `GET /me/support-requests/{id}`
- **Method:** GET
- **Request Args:** `id` (path)
- **Response:** `support_request.*` + `item.name`
- **Backend Logic:** Validate `support_request.requester_id = :userId`. Single-row fetch with `item` join via `item_id`.

---

## Screen 8 — Handover

Wireframe: _"Handover device Request"_ / _"2 ways to done handover"_ (QR scan, or pick from suggested list) / _"Info of device"_ / _"Duration"_

QR code encodes `item_id` directly. On scan, the app reads `item_id` from the QR and calls the standard device lookup — no separate QR-resolution endpoint needed.

### Get Device by ID (pre-handover lookup — reuses Screen 2 endpoint)

- **Endpoint:** `GET /me/devices/{itemId}` _(same as Screen 2 — no new endpoint)_
- **Method:** GET
- **Request Args:** `itemId` (path)
- **Response:** `item.*` + `item_category.name` + `current_owner` name from `user`
- **Backend Logic:** `item WHERE id = :itemId` joined to `item_category` and `user` via `current_owner_id`. No ownership check here — any authenticated employee can look up any device by id (QR scan or manual pick). Reject if `item.current_owner_id IS NULL` — device not assigned, handover not possible.

### Create Handover Request

- **Endpoint:** `POST /me/handover-requests`
- **Method:** POST
- **Request Args:** `{ item_id, requested_duration_hours }`
- **Response:** `handover_request.*`
- **Backend Logic:**
    - Resolve `owner_id = item.current_owner_id`; reject if null or if `owner_id = :userId` (can't request your own device).
    - Insert `handover_request`: `item_id`, `owner_id`, `borrower_id = :userId`, `requested_duration_hours`, `status = 'requested'`, `requested_at = now()`. Multiple simultaneous `requested` rows on the same device are allowed (`WORKFLOWS.md` §7) — no uniqueness check here.
    - `device_log` insert: `event_type = 'handover_requested'`, `actor_role = 'employee'`, `item_id`, `handover_request_id`, `is_milestone = false`.

### List My Handover Requests

- **Endpoint:** `GET /me/handover-requests`
- **Method:** GET
- **Request Args:** `as` — `borrower` (requests I sent) or `owner` (incoming requests on devices I own)
- **Response:** `handover_request.*` + `item.name`
- **Backend Logic:** `as=borrower` → `handover_request WHERE borrower_id = :userId`; `as=owner` → `handover_request WHERE owner_id = :userId`. Joined to `item` for name. Ordered by `requested_at DESC`.

### Accept Handover Request (owner)

- **Endpoint:** `PATCH /me/handover-requests/{id}/accept`
- **Method:** PATCH
- **Request Args:** `id` (path)
- **Response:** `handover_request.*`
- **Backend Logic:** Validate `handover_request.owner_id = :userId` and `status = 'requested'`. Enforce `uq_one_active_handover_per_item` — reject if another `accepted` row already exists for the same `item_id`. Update `status = 'accepted'`, `decided_at = now()`. Other `requested` rows on the same device are **not** auto-rejected (`WORKFLOWS.md` §7) — owner must decide them separately. `device_log` insert: `event_type = 'handover_accepted'`, `actor_role = 'employee'`, `item_id`, `handover_request_id`, `is_milestone = true`.

### Reject Handover Request (owner)

- **Endpoint:** `PATCH /me/handover-requests/{id}/reject`
- **Method:** PATCH
- **Request Args:** `id` (path)
- **Response:** `handover_request.*`
- **Backend Logic:** Validate `owner_id = :userId`, `status = 'requested'`. Update `status = 'rejected'`, `decided_at = now()`. `device_log` insert: `event_type = 'handover_rejected'`, `actor_role = 'employee'`, `item_id`, `handover_request_id`, `is_milestone = false`.

### Cancel Handover Request (borrower)

- **Endpoint:** `PATCH /me/handover-requests/{id}/cancel`
- **Method:** PATCH
- **Request Args:** `id` (path)
- **Response:** `handover_request.*`
- **Backend Logic:** Validate `borrower_id = :userId`, `status = 'requested'`. Update `status = 'cancelled'`. `device_log` insert: `event_type = 'handover_cancelled'`, `actor_role = 'employee'`, `item_id`, `handover_request_id`, `is_milestone = false`.

### Complete Handover (owner confirms device returned)

- **Endpoint:** `PATCH /me/handover-requests/{id}/complete`
- **Method:** PATCH
- **Request Args:** `id` (path)
- **Response:** `handover_request.*`
- **Backend Logic:** Validate `owner_id = :userId`, `status = 'accepted'`. Update `status = 'completed'`, `completed_at = now()`. No change to `item.status` or `item.current_owner_id` at any point in this flow (`WORKFLOWS.md` §7 — handover never touches device ownership). `device_log` insert: `event_type = 'handover_completed'`, `actor_role = 'employee'`, `item_id`, `handover_request_id`, `is_milestone = true`.

---

## Gaps / Missing Endpoints Identified

Flagged rather than silently assumed, per the instruction not to introduce new assumptions:

1. **"Report General Issue" (Internet/Electricity, with a location description)** appears in the wireframe as a support category distinct from device support, but `support_type` only has `update | damage | lost` — there is no facilities/general-issue type in the finalized schema. Building this screen as drawn would require either extending the enum or explicitly cutting it from MVP scope. No endpoint is included above for it.
2. **"Suggested devices from my department for handover"** — the wireframe implies browsing handover candidates by department, but neither `user` nor `item` has a department field anywhere in `schema_v3.dbml`. Cannot be implemented without adding a new field, which wasn't part of any prior decision. The QR-scan path (covered above) works without this.
3. **Request cancellation by the employee** — `request.cancelled_by` / `cancelled_at` exist in the schema and `rejected_by_enum` even includes `it_admin_cancel`, but `WORKFLOWS.md` never defines whether/when an _employee_ can cancel their own pending request (vs. only IT). No cancel endpoint is included above pending that decision.
4. **Extension approval-policy inheritance** (Screen 5) — flagged inline above; `WORKFLOWS.md` describes extensions as "optionally requiring the same manager+IT approval chain" but doesn't specify how `requires_mgr_approval` is derived for the extension itself. The logic above assumes it's inherited from the parent request; confirm before implementation.
