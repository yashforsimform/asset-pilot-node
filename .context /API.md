# API.md — Required Endpoints

> Derived from `WORKFLOWS.md` and `schema_v3.dbml`. Grouped by resource.
> Roles shown are the minimum required actor role per the workflow docs;
> `it_admin` can generally also perform employee/manager-scoped reads.
> Auth is assumed session/JWT-based; every endpoint below is additionally
> gated by "must be authenticated."

---

# API FORMAT

{
“data”: ,
“message”:,
“statusCode”:,
}

## 0. Auth / Session

| Method | Path           | Role | Purpose                            |
| ------ | -------------- | ---- | ---------------------------------- |
| POST   | `/auth/login`  | any  | Authenticate, return session/token |
| POST   | `/auth/logout` | any  | Invalidate session                 |
| GET    | `/auth/me`     | any  | Current user profile + role        |

---

## 1. Users

| Method | Path                  | Role                                          | Purpose                                                                                                 |
| ------ | --------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| GET    | `/users`              | it_admin                                      | List users (filter: role, is_active, manager_id)                                                        |
| GET    | `/users/:id`          | self / manager (of report) / it_admin         | Get user profile                                                                                        |
| POST   | `/users`              | it_admin                                      | Create user (onboarding)                                                                                |
| PATCH  | `/users/:id`          | self (limited fields) / it_admin (all fields) | Edit profile — self-service `manager_id`, or `role`/`is_active` by IT (offboarding = `is_active=false`) |
| GET    | `/users/:id/devices`  | self / manager / it_admin                     | Devices currently assigned to this user (`current_owner_id`)                                            |
| GET    | `/users/:id/requests` | self / manager / it_admin                     | Request history for this user                                                                           |

---

## 2. Item Categories

| Method | Path              | Role              | Purpose                                                     |
| ------ | ----------------- | ----------------- | ----------------------------------------------------------- |
| GET    | `/categories`     | any authenticated | List categories (filter: is_active)                         |
| GET    | `/categories/:id` | any authenticated | Category detail                                             |
| POST   | `/categories`     | it_admin          | Create category, set `requires_mgr_approval`                |
| PATCH  | `/categories/:id` | it_admin          | Edit category / toggle `requires_mgr_approval`, `is_active` |

---

## 3. Items (Devices)

| Method | Path                       | Role                                  | Purpose                                                                                                                                                                               |
| ------ | -------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/items`                   | any authenticated                     | List/filter devices (status, category_id, owner_type, current_owner_id)                                                                                                               |
| GET    | `/items/:id`               | any authenticated                     | Device detail                                                                                                                                                                         |
| POST   | `/items`                   | it_admin                              | Register new device (`device_created` log event)                                                                                                                                      |
| PATCH  | `/items/:id`               | it_admin                              | Edit device — name, serial, category, and the manual/terminal statuses (`maintenance`, `returned_to_client`, or Lost → next-status decision); logs `status_changed` / `device_edited` |
| POST   | `/items/:id/assign-client` | it_admin                              | Direct client-device assignment (`is_client_direct`), skips request lifecycle — logs `client_assigned`                                                                                |
| GET    | `/items/suggestions`       | it_admin                              | Suggestion window: available devices for `category_id`, `from`, `to`, excluding overlapping confirmed (`assigned_from/to`) ranges, sorted by fewest active requests / longest-free    |
| GET    | `/items/:id/availability`  | it_admin                              | Check a single device's booked ranges for a given `from`/`to` (calendar conflict check)                                                                                               |
| GET    | `/items/:id/timeline`      | any (own device) / manager / it_admin | Milestone (default) device log view                                                                                                                                                   |
| GET    | `/items/:id/log`           | it_admin                              | Full device log view (incl. non-milestone sub-events), for dispute resolution                                                                                                         |
| GET    | `/items/:id/qr`            | it_admin                              | Fetch/display QR token for the device                                                                                                                                                 |
| POST   | `/items/:id/qr/regenerate` | it_admin                              | Regenerate `qr_code_token` (compromised token)                                                                                                                                        |
| GET    | `/qr/:token`               | authenticated (borrower scan)         | Resolve a scanned QR token to its device (entry point for handover)                                                                                                                   |

---

## 4. Requests (Standard Device Request)

| Method | Path                                   | Role                                                                 | Purpose                                                                                                                                                     |
| ------ | -------------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| POST   | `/requests`                            | employee                                                             | Create request (category, `requested_from/to`, priority, note, `is_wfh`); snapshots `requires_mgr_approval` + `manager_id`, routes accordingly              |
| GET    | `/requests`                            | scoped                                                               | List/filter: `mine` (employee), `pending my approval` (manager), IT queue (`status=pending_it_approval`, sorted priority+age), by status/priority/requester |
| GET    | `/requests/:id`                        | requester / their manager / it_admin                                 | Request detail                                                                                                                                              |
| POST   | `/requests/:id/manager-decision`       | manager                                                              | Approve or reject (comment optional); rejection is terminal, row retained                                                                                   |
| POST   | `/requests/:id/it-assign`              | it_admin                                                             | Select device, set `assigned_from/to`, move to `assigned` (or `shipping_pending` if `is_wfh`)                                                               |
| POST   | `/requests/:id/it-reject`              | it_admin                                                             | IT-side rejection (`rejected_by = it_admin`)                                                                                                                |
| POST   | `/requests/:id/cancel`                 | it_admin / requester (pre-assignment)                                | Cancel request (`rejected_by = it_admin_cancel` or `cancelled_by`)                                                                                          |
| POST   | `/requests/:id/escalate-approval`      | it_admin                                                             | Late escalation — flip `requires_mgr_approval` true after creation                                                                                          |
| POST   | `/requests/:id/adjust-dates`           | it_admin                                                             | Adjust confirmed `assigned_from/to` to resolve a calendar conflict; triggers employee notification                                                          |
| POST   | `/requests/:id/ship/outbound`          | it_admin                                                             | Set `ship_tracking_url`, move device → `shipping_pending`                                                                                                   |
| POST   | `/requests/:id/ship/outbound-complete` | it_admin                                                             | Courier-confirmed delivery → device `assigned`                                                                                                              |
| POST   | `/requests/:id/return/initiate`        | it_admin (on-site) / requester (WFH, supplies `return_tracking_url`) | Start return — on-site goes straight to receive-decision; WFH → `return_shipping_pending`                                                                   |
| POST   | `/requests/:id/return/receive`         | it_admin                                                             | Confirm physical arrival, choose `completed_next_status` (available/under_repair/retired), completes request, nulls `current_owner_id`                      |
| GET    | `/requests/:id/history`                | requester / manager / it_admin                                       | Device log entries scoped to this request                                                                                                                   |

---

## 5. Extension Requests

| Method | Path                                       | Role                                              | Purpose                                                                 |
| ------ | ------------------------------------------ | ------------------------------------------------- | ----------------------------------------------------------------------- |
| POST   | `/extension-requests`                      | employee (current holder of an active assignment) | File extension against `original_request_id`, requested `extended_to`   |
| GET    | `/extension-requests`                      | scoped (mine / pending my approval / IT queue)    | List/filter                                                             |
| GET    | `/extension-requests/:id`                  | requester / manager / it_admin                    | Detail                                                                  |
| POST   | `/extension-requests/:id/manager-decision` | manager                                           | Approve/reject (only if `requires_mgr_approval`)                        |
| POST   | `/extension-requests/:id/it-decision`      | it_admin                                          | Approve (moves parent `request.assigned_to`, sets `approved`) or reject |

_(No manual endpoint for the auto-rejection when the parent completes first — that's a system-side effect of `POST /requests/:id/return/receive`.)_

---

## 6. Handover Requests (Peer-to-Peer)

| Method | Path                              | Role                        | Purpose                                                                                                     |
| ------ | --------------------------------- | --------------------------- | ----------------------------------------------------------------------------------------------------------- |
| POST   | `/handover-requests`              | any employee (borrower)     | Create from a scanned QR/device id → `requested`; multiple simultaneous `requested` rows per device allowed |
| GET    | `/handover-requests`              | owner / borrower / it_admin | List/filter by item, owner, borrower, status                                                                |
| GET    | `/handover-requests/:id`          | owner / borrower / it_admin | Detail                                                                                                      |
| POST   | `/handover-requests/:id/accept`   | owner                       | Accept — enforced: only one `accepted` per device at a time                                                 |
| POST   | `/handover-requests/:id/reject`   | owner                       | Reject                                                                                                      |
| POST   | `/handover-requests/:id/cancel`   | borrower                    | Withdraw before owner decides                                                                               |
| POST   | `/handover-requests/:id/complete` | owner                       | Mark physical return complete — device status/`current_owner_id` untouched throughout                       |

---

## 7. Support Requests

| Method | Path                            | Role                                                | Purpose                                                                                                                                                                                                                                      |
| ------ | ------------------------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| POST   | `/support-requests`             | employee (current assignee)                         | File against own assigned device — `type`: update / damage / lost                                                                                                                                                                            |
| GET    | `/support-requests`             | scoped (mine) / it_admin (open queue, oldest-first) | List/filter by status, item, requester                                                                                                                                                                                                       |
| GET    | `/support-requests/:id`         | requester / it_admin                                | Detail                                                                                                                                                                                                                                       |
| PATCH  | `/support-requests/:id`         | it_admin                                            | Update status (`in_progress`), notes                                                                                                                                                                                                         |
| POST   | `/support-requests/:id/resolve` | it_admin                                            | Set `resolution`: `remote_resolved` (Update), `repaired_in_place` / `swapped` (Damage — `swapped_to_item_id` if swap), `marked_lost` (Lost → device `lost`, terminal until IT's separate manual next-status decision via `PATCH /items/:id`) |

_(`support_auto_closed` has no endpoint — it's a system side-effect fired internally when `POST /requests/:id/return/receive` completes the parent request.)_

---

## 8. Device Log (Audit Trail)

| Method | Path                  | Role     | Purpose                                                                                         |
| ------ | --------------------- | -------- | ----------------------------------------------------------------------------------------------- |
| GET    | `/device-log`         | it_admin | Query across devices — filter `item_id`, `event_type`, `request_id`, `is_milestone`, date range |
| GET    | `/items/:id/timeline` | see §3   | (duplicate ref) milestone view                                                                  |
| GET    | `/items/:id/log`      | see §3   | (duplicate ref) full view                                                                       |

_(Log rows are never created directly via API — every write is a side-effect of the domain actions above. No `POST`/`PATCH`/`DELETE` on this resource; enforced at the DB level too via the no-update/no-delete rules.)_

---

## 9. Dashboards / Queues (convenience aggregates)

| Method | Path                       | Role     | Purpose                                                             |
| ------ | -------------------------- | -------- | ------------------------------------------------------------------- |
| GET    | `/dashboard/it-queue`      | it_admin | `pending_it_approval` requests, sorted priority desc / oldest first |
| GET    | `/dashboard/manager-queue` | manager  | Requests/extensions awaiting this manager's decision                |
| GET    | `/dashboard/my-devices`    | employee | Currently assigned devices + open support/handover status           |
| GET    | `/dashboard/support-queue` | it_admin | Open/in-progress support requests, oldest first                     |

---

## Notes on scope

- **Notifications:** email-only per design; no notification-fetch API needed (fire-and-forget on the write endpoints above).
- **No generic PUT/DELETE** on `request`, `extension_request`, `handover_request`, or `device_log` — every table is append/transition-only, matching the "never deleted" rule in `WORKFLOWS.md` §10.
- **`completed_next_status` and Lost-next-status** both route through the same `PATCH /items/:id` / `return/receive` actions rather than a dedicated endpoint — there is intentionally no automatic transition to model.
