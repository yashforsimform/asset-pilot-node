/**
 * ITAM Minimal Seed Script (TypeScript + Prisma)
 * ================================================
 * Seeds exactly:
 *   - 1 IT Admin
 *   - 2 Managers
 *   - 5 Employees (all active)
 *
 * Every enum value used in the schema is exercised at least once:
 *   UserRole, OwnerType, DeviceStatus, RequestStatus, RequestPriority,
 *   MgrApprovalStatus, RejectedBy, ExtensionStatus, SupportType,
 *   SupportStatus, SupportResolution, HandoverStatus, ActorRole,
 *   DeviceLogEvent (all string literals used as eventType).
 *
 * FK insertion order is guaranteed safe:
 *   managers → IT admin → employees → categories → items →
 *   device_created logs → requests → assignment logs →
 *   extension requests → support requests → handover requests →
 *   extra device logs
 *
 * Usage:
 *   npx prisma generate
 *   npx prisma db push
 *   npm run seed
 */

import "dotenv/config";
import { randomUUID } from "crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import {
  PrismaClient,
  Prisma,
  UserRole,
  OwnerType,
  DeviceStatus,
  RequestStatus,
  RequestPriority,
  MgrApprovalStatus,
  RejectedBy,
  ExtensionStatus,
  SupportType,
  SupportStatus,
  SupportResolution,
  HandoverStatus,
  ActorRole,
  DeviceLogEvent,
  User,
  Item,
  ItemCategory,
  Request,
  ExtensionRequest,
  SupportRequest,
  HandoverRequest,
} from "@prisma/client";

// ── Database connection ──────────────────────────────────────────────────────
const connectionString = process.env["DATABASE_URL"];
if (!connectionString) throw new Error("DATABASE_URL is not set");

const databaseUrl = new URL(connectionString);
const isLocalDatabase = ["localhost", "127.0.0.1", "::1"].includes(databaseUrl.hostname);
const pool = new Pool({
  connectionString,
  ssl: isLocalDatabase ? false : { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ── Helpers ──────────────────────────────────────────────────────────────────
function uid(): string {
  return randomUUID();
}

function now(): Date {
  return new Date();
}

function addDays(date: Date, n: number): Date {
  return new Date(date.getTime() + n * 24 * 60 * 60 * 1000);
}

function addHours(date: Date, n: number): Date {
  return new Date(date.getTime() + n * 60 * 60 * 1000);
}

function past(days = 0, hours = 0): Date {
  return addHours(addDays(now(), -days), -hours);
}

function future(days = 0): Date {
  return addDays(now(), days);
}

function dateOnly(date: Date): Date {
  return new Date(date.toISOString().slice(0, 10));
}

function makeSerial(prefix = "SN"): string {
  return `${prefix}-${Math.floor(Math.random() * 900000) + 100000}`;
}

// ── Static seed data ─────────────────────────────────────────────────────────

// 1 IT Admin
const IT_ADMIN_DATA = {
  name: "Alice Smith",
  email: "alice.smith@techcorp.internal",
};

// 2 Managers
const MANAGER_DATA = [
  { name: "Bob Johnson",   email: "bob.johnson@techcorp.internal" },
  { name: "Carol Williams", email: "carol.williams@techcorp.internal" },
];

// 5 Employees — assigned to managers (indices match MANAGER_DATA)
const EMPLOYEE_DATA = [
  { name: "David Brown",   email: "david.brown@techcorp.internal",   managerIdx: 0 },
  { name: "Emma Jones",    email: "emma.jones@techcorp.internal",    managerIdx: 0 },
  { name: "Frank Garcia",  email: "frank.garcia@techcorp.internal",  managerIdx: 1 },
  { name: "Grace Miller",  email: "grace.miller@techcorp.internal",  managerIdx: 1 },
  { name: "Henry Davis",   email: "henry.davis@techcorp.internal",   managerIdx: 0 },
];

// ── Seed function ────────────────────────────────────────────────────────────
async function runSeed(tx: Prisma.TransactionClient): Promise<void> {

  // ── 0. Truncate all tables (idempotent) ────────────────────────────────────
  console.log("Truncating all tables…");
  await tx.$executeRawUnsafe(`
    TRUNCATE TABLE
      device_log,
      support_request,
      handover_request,
      extension_request,
      request,
      item,
      item_category,
      "user"
    RESTART IDENTITY CASCADE;
  `);

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. USERS
  // FK-safe order: managers → IT admin → employees
  // Employees reference managers via managerId, so managers must exist first.
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("Seeding users…");

  // ── 1a. 2 Managers (no FK deps — managerId = null) ─────────────────────────
  const managers: User[] = [];
  for (const md of MANAGER_DATA) {
    const u = await tx.user.create({
      data: {
        id: uid(),
        name: md.name,
        email: md.email,
        role: UserRole.manager,   // enum: UserRole.manager
        managerId: null,
        isActive: true,
        createdAt: past(180),
        updatedAt: past(10),
      },
    });
    managers.push(u);
  }
  const [manager1, manager2] = managers as [User, User];

  // ── 1b. 1 IT Admin (no FK deps — managerId = null) ────────────────────────
  const itAdmin: User = await tx.user.create({
    data: {
      id: uid(),
      name: IT_ADMIN_DATA.name,
      email: IT_ADMIN_DATA.email,
      role: UserRole.it_admin,    // enum: UserRole.it_admin
      managerId: null,
      isActive: true,
      createdAt: past(180),
      updatedAt: past(10),
    },
  });

  // ── 1c. 5 Employees (FK → managers, which exist already) ──────────────────
  const employees: User[] = [];
  for (const ed of EMPLOYEE_DATA) {
    const mgr = managers[ed.managerIdx] as User;
    const u = await tx.user.create({
      data: {
        id: uid(),
        name: ed.name,
        email: ed.email,
        role: UserRole.employee,  // enum: UserRole.employee
        managerId: mgr.id,        // FK → user.id (manager already inserted above)
        isActive: true,
        createdAt: past(90),
        updatedAt: past(5),
      },
    });
    employees.push(u);
  }

  const [emp1, emp2, emp3, emp4, emp5] = employees as [User, User, User, User, User];
  const allUsers: User[] = [manager1, manager2, itAdmin, ...employees];

  console.log(`  Created: ${allUsers.length} users (1 IT admin, 2 managers, 5 employees)`);

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. ITEM CATEGORIES
  // Covers: requiresMgrApproval = true/false, isActive = true/false
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("Seeding item categories…");

  const catDefs: Array<[string, string, boolean, boolean]> = [
    ["Laptop",       "Portable computers for daily work",             true,  true],
    ["Mobile Phone", "Company smartphones for employees",             true,  true],
    ["Monitor",      "External display monitors",                     false, true],
    ["Keyboard",     "Mechanical and membrane keyboards",             false, true],
    ["Mouse",        "Wireless and wired mice",                       false, true],
    ["Headset",      "Noise-cancelling headsets and earphones",       false, true],
    ["Charger",      "Power adapters and charging cables",            false, true],
    ["Tablet",       "Tablets for presentations and fieldwork",       true,  true],
    ["Dock",         "Docking stations and USB-C hubs",               false, true],
    ["Legacy",       "Retired category for old device types",         false, false], // isActive=false
  ];

  const categories: Record<string, ItemCategory> = {};
  for (const [name, desc, reqMgr, isActive] of catDefs) {
    const c = await tx.itemCategory.create({
      data: {
        id: uid(),
        name,
        description: desc,
        requiresMgrApproval: reqMgr,
        isActive,
        createdAt: past(200),
        updatedAt: past(5),
      },
    });
    categories[name] = c;
  }

  function cat(name: string): ItemCategory {
    const c = categories[name];
    if (!c) throw new Error(`Category not found: ${name}`);
    return c;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. ITEMS (DEVICES)
  // Covers all DeviceStatus enum values:
  //   available, assigned, under_repair, maintenance, lost, retired,
  //   shipping_pending, return_shipping_pending
  // Covers OwnerType: company, client
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("Seeding items (devices)…");

  const allItems: Item[] = [];

  async function makeItem(
    name: string,
    categoryName: string,
    opts: {
      status?: DeviceStatus;
      ownerType?: OwnerType;
      clientName?: string | null;
      currentOwnerId?: string | null;
      purchaseDaysAgo?: number;
    } = {}
  ): Promise<Item> {
    const purchaseDaysAgo = opts.purchaseDaysAgo ?? 180;
    const created = past(purchaseDaysAgo);
    const item = await tx.item.create({
      data: {
        id: uid(),
        name,
        serialNo: makeSerial(),
        categoryId: cat(categoryName).id,
        ownerType: opts.ownerType ?? OwnerType.company,  // enum: OwnerType.company
        clientName: opts.clientName ?? null,
        status: opts.status ?? DeviceStatus.available,   // enum: DeviceStatus.available
        currentOwnerId: opts.currentOwnerId ?? null,
        purchaseDate: dateOnly(created),
        qrCodeToken: uid(),
        createdAt: created,
        updatedAt: now(),
      },
    });
    allItems.push(item);
    return item;
  }

  // DeviceStatus.available — standard company laptops
  const laptop1 = await makeItem('MacBook Pro 14"',         "Laptop",       { purchaseDaysAgo: 120 });
  const laptop2 = await makeItem("Dell XPS 15",             "Laptop",       { purchaseDaysAgo: 200 });
  const laptop3 = await makeItem("Lenovo ThinkPad X1 Carbon", "Laptop",     { purchaseDaysAgo: 90  });
  const laptop4 = await makeItem("HP EliteBook 840",        "Laptop",       { purchaseDaysAgo: 150 });
  const phone1  = await makeItem("iPhone 15 Pro",           "Mobile Phone", { purchaseDaysAgo: 60  });
  const monitor1 = await makeItem('Dell UltraSharp 27" 4K', "Monitor",      { purchaseDaysAgo: 300 });

  // DeviceStatus.assigned — client-owned device (OwnerType.client)
  const clientLaptop = await makeItem(
    "Acme Corp — MacBook Air M2", "Laptop",
    {
      ownerType: OwnerType.client,   // enum: OwnerType.client
      clientName: "Acme Corp",
      status: DeviceStatus.assigned, // enum: DeviceStatus.assigned
      currentOwnerId: emp1.id,
      purchaseDaysAgo: 60,
    }
  );

  // DeviceStatus.under_repair
  const repairLaptop = await makeItem("Dell Latitude 5540", "Laptop", {
    status: DeviceStatus.under_repair, // enum: DeviceStatus.under_repair
    purchaseDaysAgo: 400,
  });

  // DeviceStatus.maintenance
  const maintMonitor = await makeItem('LG UltraFine 27"', "Monitor", {
    status: DeviceStatus.maintenance, // enum: DeviceStatus.maintenance
    purchaseDaysAgo: 250,
  });

  // DeviceStatus.lost
  const lostPhone = await makeItem("Samsung Galaxy S24 Ultra", "Mobile Phone", {
    status: DeviceStatus.lost, // enum: DeviceStatus.lost
    purchaseDaysAgo: 50,
  });

  // DeviceStatus.retired
  const retiredLaptop = await makeItem("MacBook Pro 16\"", "Laptop", {
    status: DeviceStatus.retired, // enum: DeviceStatus.retired
    purchaseDaysAgo: 1460,        // ~4 years old
  });

  // DeviceStatus.shipping_pending (WFH device being shipped out)
  const shipPendingLaptop = await makeItem("ASUS ZenBook 14", "Laptop", {
    status: DeviceStatus.shipping_pending, // enum: DeviceStatus.shipping_pending
    currentOwnerId: emp3.id,
    purchaseDaysAgo: 100,
  });

  // DeviceStatus.return_shipping_pending (WFH device being returned)
  const returnPendingLaptop = await makeItem("Microsoft Surface Laptop 5", "Laptop", {
    status: DeviceStatus.return_shipping_pending, // enum: DeviceStatus.return_shipping_pending
    currentOwnerId: emp4.id,
    purchaseDaysAgo: 130,
  });

  console.log(`  Created: ${allItems.length} items (all DeviceStatus & OwnerType values covered)`);

  // ═══════════════════════════════════════════════════════════════════════════
  // Device-log helper (typed with DeviceLogEvent)
  // ═══════════════════════════════════════════════════════════════════════════
  interface LogEventOpts {
    itemId: string;
    eventType: DeviceLogEvent;           // typed enum — catches typos at compile time
    actorRole: ActorRole;
    actorId?: string | null;
    requestId?: string | null;
    supportRequestId?: string | null;
    extensionRequestId?: string | null;
    handoverRequestId?: string | null;
    fromValue?: string | null;
    toValue?: string | null;
    note?: string | null;
    metadata?: Record<string, unknown> | null;
    isMilestone?: boolean;
    occurredAt?: Date | null;
  }

  async function logEvent(opts: LogEventOpts): Promise<void> {
    const occurredAt = opts.occurredAt ?? now();
    await tx.deviceLog.create({
      data: {
        id: uid(),
        itemId: opts.itemId,
        eventType: opts.eventType,
        actorId: opts.actorId ?? null,
        actorRole: opts.actorRole,                            // enum: ActorRole.*
        requestId: opts.requestId ?? null,
        supportRequestId: opts.supportRequestId ?? null,
        extensionRequestId: opts.extensionRequestId ?? null,
        handoverRequestId: opts.handoverRequestId ?? null,
        fromValue: opts.fromValue ?? null,
        toValue: opts.toValue ?? null,
        note: opts.note ?? null,
        metadata: (opts.metadata ?? {}) as Prisma.InputJsonValue,
        isMilestone: opts.isMilestone ?? false,
        occurredAt,
        createdAt: occurredAt,
        updatedAt: occurredAt,
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. DEVICE LOG — device_created for every item
  // ActorRole.it_admin used here.
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("Seeding device_created log entries…");
  for (const item of allItems) {
    await logEvent({
      itemId: item.id,
      eventType: "device_created",          // DeviceLogEvent
      actorId: itAdmin.id,
      actorRole: ActorRole.it_admin,        // enum: ActorRole.it_admin
      toValue: DeviceStatus.available,
      note: `Device added to inventory: ${item.name}`,
      isMilestone: false,
      occurredAt: item.createdAt,
    });
  }

  // ── Special status-change logs for non-available items ────────────────────
  await logEvent({
    itemId: repairLaptop.id,
    eventType: "status_changed",
    actorId: itAdmin.id,
    actorRole: ActorRole.it_admin,
    fromValue: DeviceStatus.assigned,
    toValue: DeviceStatus.under_repair,
    note: "Device sent to repair centre — screen failure",
    isMilestone: true,
    occurredAt: past(5),
  });

  await logEvent({
    itemId: maintMonitor.id,
    eventType: "status_changed",
    actorId: itAdmin.id,
    actorRole: ActorRole.it_admin,
    fromValue: DeviceStatus.available,
    toValue: DeviceStatus.maintenance,
    note: "Scheduled maintenance: firmware update batch",
    isMilestone: false,
    occurredAt: past(2),
  });

  await logEvent({
    itemId: lostPhone.id,
    eventType: "marked_lost",
    actorId: itAdmin.id,
    actorRole: ActorRole.it_admin,
    fromValue: DeviceStatus.assigned,
    toValue: DeviceStatus.lost,
    note: "Employee confirmed phone cannot be located",
    isMilestone: true,
    occurredAt: past(10),
  });

  await logEvent({
    itemId: retiredLaptop.id,
    eventType: "retired",
    actorId: itAdmin.id,
    actorRole: ActorRole.it_admin,
    fromValue: DeviceStatus.available,
    toValue: DeviceStatus.retired,
    note: "Device exceeded 4-year lifecycle policy — retired from inventory",
    isMilestone: true,
    occurredAt: past(30),
  });

  // Client device log (uses "client_assigned" event + ActorRole.it_admin)
  await logEvent({
    itemId: clientLaptop.id,
    eventType: "client_assigned",
    actorId: itAdmin.id,
    actorRole: ActorRole.it_admin,
    fromValue: DeviceStatus.available,
    toValue: DeviceStatus.assigned,
    note: "Client device from Acme Corp directly assigned",
    isMilestone: true,
    occurredAt: past(60),
  });

  // Device edit log
  await logEvent({
    itemId: laptop1.id,
    eventType: "device_edited",
    actorId: itAdmin.id,
    actorRole: ActorRole.it_admin,
    note: "Serial number corrected after physical audit",
    metadata: { field: "serial_no", old: "SN-OLD-001", new: laptop1.serialNo },
    isMilestone: false,
    occurredAt: past(7),
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. REQUESTS — all RequestStatus, RequestPriority, MgrApprovalStatus,
  //               RejectedBy values covered
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("Seeding requests…");

  type ItDecidedByArg = User | "none" | null | undefined;

  const PENDING_STATUSES: RequestStatus[] = [
    RequestStatus.requested,
    RequestStatus.pending_mgr_approval,
    RequestStatus.pending_it_approval,
    RequestStatus.rejected,
    RequestStatus.cancelled,
  ];

  function computeItDecidedById(itDecidedBy: ItDecidedByArg, status: RequestStatus): string | null {
    const isFinal = !PENDING_STATUSES.includes(status);
    const isUser = itDecidedBy != null && itDecidedBy !== "none";
    if (itDecidedBy !== "none" && isFinal) return isUser ? (itDecidedBy as User).id : itAdmin.id;
    return isUser ? (itDecidedBy as User).id : null;
  }

  interface MakeRequestOpts {
    status: RequestStatus;
    priority?: RequestPriority;
    reqFrom: Date;
    reqTo: Date;
    assignedItem?: Item | null;
    assignedFrom?: Date | null;
    assignedTo?: Date | null;
    requiresMgr?: boolean;
    mgrStatus?: MgrApprovalStatus;
    managerId?: string | null;
    mgrDecidedAt?: Date | null;
    itDecidedBy?: ItDecidedByArg;
    itDecidedAt?: Date | null;
    rejectedBy?: RejectedBy | null;
    rejectedReason?: string | null;
    cancelledBy?: User | null;
    cancelledAt?: Date | null;
    isWfh?: boolean;
    shipTracking?: string | null;
    shipInit?: Date | null;
    shipDone?: Date | null;
    retTracking?: string | null;
    retInit?: Date | null;
    completedAt?: Date | null;
    completedBy?: User | null;
    completedNext?: DeviceStatus | null;
    isClientDirect?: boolean;
    note?: string | null;
    createdAt?: Date | null;
  }

  const allRequests: Request[] = [];

  async function makeRequest(
    requester: User,
    categoryName: string,
    opts: MakeRequestOpts
  ): Promise<Request> {
    const category = cat(categoryName);
    const requiresMgr = opts.requiresMgr ?? category.requiresMgrApproval;
    const createdAt = opts.createdAt ?? addDays(opts.reqFrom, -3);
    const r = await tx.request.create({
      data: {
        id: uid(),
        requesterId: requester.id,
        categoryId: category.id,
        assignedItemId: opts.assignedItem?.id ?? null,
        requestedFrom: opts.reqFrom,
        requestedTo: opts.reqTo,
        assignedFrom: opts.assignedFrom ?? null,
        assignedTo: opts.assignedTo ?? null,
        status: opts.status,
        priority: opts.priority ?? RequestPriority.medium,
        note: opts.note ?? "Standard device request",
        requiresMgrApproval: requiresMgr,
        mgrApprovalStatus: opts.mgrStatus ?? MgrApprovalStatus.not_required,
        managerId: opts.managerId ?? requester.managerId ?? null,
        managerDecisionNote: null,
        managerDecidedAt: opts.mgrDecidedAt ?? null,
        itDecidedById: computeItDecidedById(opts.itDecidedBy, opts.status),
        itDecisionNote: null,
        itDecidedAt: opts.itDecidedAt ?? null,
        rejectedBy: opts.rejectedBy ?? null,
        rejectedReason: opts.rejectedReason ?? null,
        cancelledById: opts.cancelledBy?.id ?? null,
        cancelledAt: opts.cancelledAt ?? null,
        isWfh: opts.isWfh ?? false,
        shipTrackingUrl: opts.shipTracking ?? null,
        shipInitiatedAt: opts.shipInit ?? null,
        shipCompletedAt: opts.shipDone ?? null,
        returnTrackingUrl: opts.retTracking ?? null,
        returnInitiatedAt: opts.retInit ?? null,
        completedAt: opts.completedAt ?? null,
        completedById: opts.completedBy?.id ?? null,
        completedNextStatus: opts.completedNext ?? null,
        isClientDirect: opts.isClientDirect ?? false,
        createdAt,
        updatedAt: now(),
      },
    });
    allRequests.push(r);
    return r;
  }

  // ── R1: RequestStatus.completed + RequestPriority.high
  //        MgrApprovalStatus.approved, RejectedBy not set
  const r1Start = past(90);
  const r1End   = past(30);
  const r1 = await makeRequest(emp1, "Laptop", {
    status: RequestStatus.completed,          // enum: RequestStatus.completed
    priority: RequestPriority.high,           // enum: RequestPriority.high
    reqFrom: r1Start,
    reqTo: addDays(r1End, 5),
    assignedItem: laptop1,
    assignedFrom: r1Start,
    assignedTo: r1End,
    requiresMgr: true,
    mgrStatus: MgrApprovalStatus.approved,    // enum: MgrApprovalStatus.approved
    managerId: emp1.managerId,
    mgrDecidedAt: addHours(r1Start, 4),
    itDecidedAt: addHours(r1Start, 8),
    completedAt: r1End,
    completedBy: itAdmin,
    completedNext: DeviceStatus.available,
    createdAt: addDays(r1Start, -5),
    note: "Needed for Q3 project — completed and returned",
  });
  // Reset laptop1 to available after completion
  await tx.item.update({ where: { id: laptop1.id }, data: { status: DeviceStatus.available, currentOwnerId: null } });
  laptop1.status = DeviceStatus.available;
  laptop1.currentOwnerId = null;

  // ── R2: RequestStatus.assigned + RequestPriority.medium
  //        MgrApprovalStatus.approved (currently active assignment)
  const r2Start = past(10);
  const r2 = await makeRequest(emp2, "Laptop", {
    status: RequestStatus.assigned,           // enum: RequestStatus.assigned
    priority: RequestPriority.medium,         // enum: RequestPriority.medium
    reqFrom: r2Start,
    reqTo: future(30),
    assignedItem: laptop2,
    assignedFrom: r2Start,
    assignedTo: future(30),
    requiresMgr: true,
    mgrStatus: MgrApprovalStatus.approved,
    managerId: emp2.managerId,
    mgrDecidedAt: addHours(r2Start, 3),
    itDecidedAt: addHours(r2Start, 6),
    createdAt: addDays(r2Start, -3),
    note: "New hire onboarding — day one start",
  });
  await tx.item.update({ where: { id: laptop2.id }, data: { status: DeviceStatus.assigned, currentOwnerId: emp2.id } });
  laptop2.status = DeviceStatus.assigned;
  laptop2.currentOwnerId = emp2.id;

  // ── R3: RequestStatus.assigned + RequestPriority.low
  //        MgrApprovalStatus.not_required (monitor — no mgr needed)
  const r3Start = past(5);
  const r3 = await makeRequest(emp3, "Monitor", {
    status: RequestStatus.assigned,
    priority: RequestPriority.low,            // enum: RequestPriority.low
    reqFrom: r3Start,
    reqTo: future(60),
    assignedItem: monitor1,
    assignedFrom: r3Start,
    assignedTo: future(60),
    requiresMgr: false,
    mgrStatus: MgrApprovalStatus.not_required, // enum: MgrApprovalStatus.not_required
    itDecidedAt: r3Start,
    createdAt: addDays(r3Start, -1),
    note: "External monitor for home office setup",
  });
  await tx.item.update({ where: { id: monitor1.id }, data: { status: DeviceStatus.assigned, currentOwnerId: emp3.id } });
  monitor1.status = DeviceStatus.assigned;
  monitor1.currentOwnerId = emp3.id;

  // ── R4: RequestStatus.assigned — WFH outbound shipping (shipping_pending)
  const r4Start = past(2);
  const r4 = await makeRequest(emp3, "Laptop", {
    status: RequestStatus.assigned,
    priority: RequestPriority.high,
    reqFrom: r4Start,
    reqTo: future(45),
    assignedItem: shipPendingLaptop,
    assignedFrom: addDays(r4Start, 3),
    assignedTo: future(45),
    requiresMgr: true,
    mgrStatus: MgrApprovalStatus.approved,
    managerId: emp3.managerId,
    mgrDecidedAt: addHours(past(4), 2),
    itDecidedAt: past(3),
    isWfh: true,
    shipTracking: "https://tracking.fedex.com/WFH-OUT-001",
    shipInit: past(1),
    createdAt: past(6),
    note: "WFH setup — device in transit",
  });

  // ── R5: RequestStatus.assigned — WFH return shipping (return_shipping_pending)
  const r5Start = past(30);
  const r5 = await makeRequest(emp4, "Laptop", {
    status: RequestStatus.assigned,
    priority: RequestPriority.medium,
    reqFrom: r5Start,
    reqTo: future(3),
    assignedItem: returnPendingLaptop,
    assignedFrom: addDays(r5Start, 2),
    assignedTo: future(3),
    requiresMgr: true,
    mgrStatus: MgrApprovalStatus.approved,
    managerId: emp4.managerId,
    mgrDecidedAt: addDays(r5Start, -1),
    itDecidedAt: r5Start,
    isWfh: true,
    shipTracking: "https://tracking.dhl.com/WFH-OUT-002",
    shipInit: addHours(r5Start, 8),
    shipDone: addDays(r5Start, 2),
    retTracking: "https://tracking.ups.com/WFH-RET-002",
    retInit: past(2),
    createdAt: addDays(r5Start, -3),
    note: "WFH contract ending — return initiated",
  });

  // ── R6: RequestStatus.pending_it_approval
  //        MgrApprovalStatus.approved (mgr already said yes, IT pending)
  const r6Start = future(5);
  const r6 = await makeRequest(emp1, "Mobile Phone", {
    status: RequestStatus.pending_it_approval, // enum: RequestStatus.pending_it_approval
    priority: RequestPriority.medium,
    reqFrom: r6Start,
    reqTo: future(35),
    requiresMgr: true,
    mgrStatus: MgrApprovalStatus.approved,
    managerId: emp1.managerId,
    mgrDecidedAt: past(1),
    itDecidedBy: "none",
    createdAt: past(2),
    note: "Phone required for field sales team",
  });

  // ── R7: RequestStatus.pending_mgr_approval
  //        MgrApprovalStatus.pending
  const r7Start = future(10);
  const r7 = await makeRequest(emp2, "Laptop", {
    status: RequestStatus.pending_mgr_approval, // enum: RequestStatus.pending_mgr_approval
    priority: RequestPriority.high,
    reqFrom: r7Start,
    reqTo: future(40),
    requiresMgr: true,
    mgrStatus: MgrApprovalStatus.pending,       // enum: MgrApprovalStatus.pending
    managerId: emp2.managerId,
    itDecidedBy: "none",
    createdAt: past(1),
    note: "Replacement laptop — current one failing",
  });

  // ── R8: RequestStatus.requested (just submitted, no approvals yet)
  //        MgrApprovalStatus.not_required (keyboard — no mgr needed)
  const r8Start = future(3);
  const r8 = await makeRequest(emp5, "Keyboard", {
    status: RequestStatus.requested,          // enum: RequestStatus.requested
    priority: RequestPriority.low,
    reqFrom: r8Start,
    reqTo: future(20),
    requiresMgr: false,
    mgrStatus: MgrApprovalStatus.not_required,
    itDecidedBy: "none",
    createdAt: now(),
    note: "Mechanical keyboard for ergonomic setup",
  });

  // ── R9: RequestStatus.rejected by manager
  //        MgrApprovalStatus.rejected, RejectedBy.manager
  const r9Start = past(40);
  const r9 = await makeRequest(emp4, "Tablet", {
    status: RequestStatus.rejected,           // enum: RequestStatus.rejected
    priority: RequestPriority.low,
    reqFrom: r9Start,
    reqTo: past(10),
    requiresMgr: true,
    mgrStatus: MgrApprovalStatus.rejected,    // enum: MgrApprovalStatus.rejected
    managerId: emp4.managerId,
    mgrDecidedAt: addHours(r9Start, 8),
    itDecidedBy: "none",
    rejectedBy: RejectedBy.manager,           // enum: RejectedBy.manager
    rejectedReason: "Business justification insufficient for tablet at this time",
    createdAt: addDays(r9Start, -3),
    note: "Tablet for field presentations",
  });

  // ── R10: RequestStatus.rejected by IT admin
  //         MgrApprovalStatus.approved, RejectedBy.it_admin
  const r10Start = past(25);
  const r10 = await makeRequest(emp5, "Laptop", {
    status: RequestStatus.rejected,
    priority: RequestPriority.medium,
    reqFrom: r10Start,
    reqTo: past(5),
    requiresMgr: true,
    mgrStatus: MgrApprovalStatus.approved,
    managerId: emp5.managerId,
    mgrDecidedAt: addHours(r10Start, 4),
    itDecidedBy: undefined,                   // IT decided
    itDecidedAt: addHours(r10Start, 12),
    rejectedBy: RejectedBy.it_admin,          // enum: RejectedBy.it_admin
    rejectedReason: "Device not available for requested period — all units allocated",
    createdAt: addDays(r10Start, -2),
    note: "Needed for short-term client project",
  });

  // ── R11: RequestStatus.cancelled (employee withdrew)
  const r11Start = past(20);
  const r11CancelAt = addHours(r11Start, 5);
  const r11 = await makeRequest(emp1, "Headset", {
    status: RequestStatus.cancelled,          // enum: RequestStatus.cancelled
    priority: RequestPriority.low,
    reqFrom: addDays(r11Start, 5),
    reqTo: addDays(r11Start, 25),
    requiresMgr: false,
    mgrStatus: MgrApprovalStatus.not_required,
    itDecidedBy: "none",
    cancelledBy: emp1,
    cancelledAt: r11CancelAt,
    createdAt: r11Start,
    note: "No longer needed — using existing headset",
  });

  // ── R12: Client direct-assign (isClientDirect = true)
  const r12Start = past(60);
  const r12 = await makeRequest(emp1, "Laptop", {
    status: RequestStatus.assigned,
    priority: RequestPriority.high,
    reqFrom: r12Start,
    reqTo: future(60),
    assignedItem: clientLaptop,
    assignedFrom: r12Start,
    assignedTo: future(60),
    requiresMgr: false,
    mgrStatus: MgrApprovalStatus.not_required,
    itDecidedAt: r12Start,
    isClientDirect: true,
    note: "Client-provided device — direct assign",
    createdAt: r12Start,
  });

  // ── R13: Under-repair device request
  const r13Start = past(25);
  const r13 = await makeRequest(emp2, "Laptop", {
    status: RequestStatus.assigned,
    priority: RequestPriority.high,
    reqFrom: r13Start,
    reqTo: future(20),
    assignedItem: repairLaptop,
    assignedFrom: r13Start,
    assignedTo: future(20),
    requiresMgr: true,
    mgrStatus: MgrApprovalStatus.approved,
    managerId: emp2.managerId,
    mgrDecidedAt: addDays(r13Start, -1),
    itDecidedAt: r13Start,
    createdAt: addDays(r13Start, -4),
    note: "Assigned before device went to repair",
  });
  await tx.item.update({ where: { id: repairLaptop.id }, data: { currentOwnerId: emp2.id } });
  repairLaptop.currentOwnerId = emp2.id;

  console.log(`  Created: ${allRequests.length} requests (all RequestStatus, Priority, MgrApprovalStatus & RejectedBy values covered)`);

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. DEVICE LOG — assignment events
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("Seeding assignment log events…");

  // Completed assignment logs
  await logEvent({
    itemId: laptop1.id,
    eventType: "assigned",
    actorId: itAdmin.id,
    actorRole: ActorRole.it_admin,
    requestId: r1.id,
    fromValue: DeviceStatus.available,
    toValue: DeviceStatus.assigned,
    note: `Assigned to ${emp1.name} for period ending ${r1.assignedTo?.toISOString().slice(0, 10) ?? "N/A"}`,
    isMilestone: true,
    occurredAt: r1.assignedFrom ?? r1.createdAt,
  });
  await logEvent({
    itemId: laptop1.id,
    eventType: "assignment_completed",
    actorId: itAdmin.id,
    actorRole: ActorRole.it_admin,
    requestId: r1.id,
    fromValue: DeviceStatus.assigned,
    toValue: DeviceStatus.available,
    note: "Return processed, device status updated",
    isMilestone: true,
    occurredAt: r1.completedAt ?? now(),
  });

  // Active assignment logs
  for (const [req, item, emp] of [
    [r2, laptop2, emp2],
    [r3, monitor1, emp3],
  ] as [Request, Item, User][]) {
    await logEvent({
      itemId: item.id,
      eventType: "assigned",
      actorId: itAdmin.id,
      actorRole: ActorRole.it_admin,
      requestId: req.id,
      fromValue: DeviceStatus.available,
      toValue: DeviceStatus.assigned,
      note: `Assigned to ${emp.name}`,
      isMilestone: true,
      occurredAt: req.assignedFrom ?? req.createdAt,
    });
  }

  // WFH outbound shipping log (shipping_pending)
  await logEvent({
    itemId: shipPendingLaptop.id,
    eventType: "assigned",
    actorId: itAdmin.id,
    actorRole: ActorRole.it_admin,
    requestId: r4.id,
    fromValue: DeviceStatus.available,
    toValue: DeviceStatus.assigned,
    note: `Assigned to ${emp3.name} (WFH — shipping)`,
    isMilestone: true,
    occurredAt: r4.assignedFrom ?? r4.createdAt,
  });
  await logEvent({
    itemId: shipPendingLaptop.id,
    eventType: "ship_outbound_initiated",
    actorId: itAdmin.id,
    actorRole: ActorRole.it_admin,
    requestId: r4.id,
    note: "Outbound shipping initiated",
    metadata: { tracking_url: r4.shipTrackingUrl },
    isMilestone: false,
    occurredAt: r4.shipInitiatedAt,
  });

  // WFH return shipping log (return_shipping_pending)
  await logEvent({
    itemId: returnPendingLaptop.id,
    eventType: "assigned",
    actorId: itAdmin.id,
    actorRole: ActorRole.it_admin,
    requestId: r5.id,
    fromValue: DeviceStatus.available,
    toValue: DeviceStatus.assigned,
    note: `Assigned to ${emp4.name} (WFH)`,
    isMilestone: true,
    occurredAt: r5.assignedFrom ?? r5.createdAt,
  });
  await logEvent({
    itemId: returnPendingLaptop.id,
    eventType: "ship_outbound_completed",
    actorId: itAdmin.id,
    actorRole: ActorRole.it_admin,
    requestId: r5.id,
    note: "Outbound delivery confirmed",
    isMilestone: true,
    occurredAt: r5.shipCompletedAt,
  });
  await logEvent({
    itemId: returnPendingLaptop.id,
    eventType: "ship_outbound_initiated",   // kept for log completeness
    actorId: itAdmin.id,
    actorRole: ActorRole.it_admin,
    requestId: r5.id,
    note: "Return shipping initiated by employee",
    metadata: { tracking_url: r5.returnTrackingUrl },
    isMilestone: false,
    occurredAt: r5.returnInitiatedAt,
  });

  // Client-assigned log (uses "client_assigned" event + isClientDirect flag)
  await logEvent({
    itemId: clientLaptop.id,
    eventType: "client_assigned",
    actorId: itAdmin.id,
    actorRole: ActorRole.it_admin,
    requestId: r12.id,
    fromValue: DeviceStatus.available,
    toValue: DeviceStatus.assigned,
    note: `Client device assigned to ${emp1.name}`,
    isMilestone: true,
    occurredAt: r12.assignedFrom ?? r12.createdAt,
  });

  // Under-repair assignment log
  await logEvent({
    itemId: repairLaptop.id,
    eventType: "assigned",
    actorId: itAdmin.id,
    actorRole: ActorRole.it_admin,
    requestId: r13.id,
    fromValue: DeviceStatus.available,
    toValue: DeviceStatus.assigned,
    note: `Assigned to ${emp2.name}`,
    isMilestone: true,
    occurredAt: r13.assignedFrom ?? r13.createdAt,
  });

  // system actor role (auto-events use ActorRole.system)
  await logEvent({
    itemId: laptop3.id,
    eventType: "status_changed",
    actorId: null,                            // system — no actor
    actorRole: ActorRole.system,              // enum: ActorRole.system
    fromValue: DeviceStatus.available,
    toValue: DeviceStatus.available,
    note: "Automated availability check — no change",
    isMilestone: false,
    occurredAt: past(1),
  });

  // manager actor role (managers can also act on items)
  await logEvent({
    itemId: laptop4.id,
    eventType: "device_edited",
    actorId: manager1.id,
    actorRole: ActorRole.manager,             // enum: ActorRole.manager
    note: "Manager confirmed device is in good condition after audit",
    isMilestone: false,
    occurredAt: past(3),
  });

  // employee actor role (employees trigger support/handover events)
  await logEvent({
    itemId: laptop2.id,
    eventType: "status_changed",
    actorId: emp2.id,
    actorRole: ActorRole.employee,            // enum: ActorRole.employee
    requestId: r2.id,
    fromValue: DeviceStatus.available,
    toValue: DeviceStatus.assigned,
    note: "Employee acknowledged device receipt",
    isMilestone: false,
    occurredAt: addHours(r2.createdAt, 2),
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. EXTENSION REQUESTS
  // Covers all ExtensionStatus values: approved, pending, rejected
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("Seeding extension requests…");
  const allExtensions: ExtensionRequest[] = [];

  // ── E1: ExtensionStatus.approved ──────────────────────────────────────────
  const e1Decided = past(5);
  const e1OldTo = r2.assignedTo;
  const e1NewTo = e1OldTo ? addDays(e1OldTo, 14) : future(44);
  const e1 = await tx.extensionRequest.create({
    data: {
      id: uid(),
      originalRequestId: r2.id,
      requesterId: emp2.id,
      currentAssignedTo: e1OldTo ?? future(30),
      extendedTo: e1NewTo,
      status: ExtensionStatus.approved,       // enum: ExtensionStatus.approved
      requiresMgrApproval: true,
      managerId: emp2.managerId,
      mgrApprovalStatus: MgrApprovalStatus.approved,
      managerNote: "Approved — project timeline extended",
      managerDecidedAt: addHours(e1Decided, -6),
      itDecidedById: itAdmin.id,
      itNote: "No conflicts found for extended range",
      itDecidedAt: e1Decided,
      createdAt: addDays(e1Decided, -2),
      updatedAt: e1Decided,
    },
  });
  allExtensions.push(e1);
  await tx.request.update({ where: { id: r2.id }, data: { assignedTo: e1NewTo } });
  r2.assignedTo = e1NewTo;

  await logEvent({
    itemId: laptop2.id,
    eventType: "extension_requested",
    actorId: emp2.id,
    actorRole: ActorRole.employee,
    requestId: r2.id,
    extensionRequestId: e1.id,
    note: `Extension requested to ${e1NewTo.toISOString().slice(0, 10)}`,
    isMilestone: false,
    occurredAt: e1.createdAt,
  });
  await logEvent({
    itemId: laptop2.id,
    eventType: "extension_approved",
    actorId: itAdmin.id,
    actorRole: ActorRole.it_admin,
    requestId: r2.id,
    extensionRequestId: e1.id,
    fromValue: e1OldTo?.toISOString().slice(0, 10) ?? "",
    toValue: e1NewTo.toISOString().slice(0, 10),
    note: "Extension approved — assigned_to updated",
    metadata: { extended_by_days: 14 },
    isMilestone: true,
    occurredAt: e1Decided,
  });

  // ── E2: ExtensionStatus.pending ────────────────────────────────────────────
  const e2CurrentTo = r3.assignedTo ?? future(60);
  const e2 = await tx.extensionRequest.create({
    data: {
      id: uid(),
      originalRequestId: r3.id,
      requesterId: emp3.id,
      currentAssignedTo: e2CurrentTo,
      extendedTo: addDays(e2CurrentTo, 21),
      status: ExtensionStatus.pending,        // enum: ExtensionStatus.pending
      requiresMgrApproval: false,
      managerId: null,
      mgrApprovalStatus: MgrApprovalStatus.not_required,
      managerNote: null,
      managerDecidedAt: null,
      itDecidedById: null,
      itNote: null,
      itDecidedAt: null,
      createdAt: past(1),
      updatedAt: past(1),
    },
  });
  allExtensions.push(e2);
  await logEvent({
    itemId: monitor1.id,
    eventType: "extension_requested",
    actorId: emp3.id,
    actorRole: ActorRole.employee,
    requestId: r3.id,
    extensionRequestId: e2.id,
    note: "Extension requested — awaiting IT review",
    isMilestone: false,
    occurredAt: e2.createdAt,
  });

  // ── E3: ExtensionStatus.rejected ──────────────────────────────────────────
  const e3Decided = past(8);
  const e3CurrentTo = r1.assignedTo ?? past(30);
  const e3 = await tx.extensionRequest.create({
    data: {
      id: uid(),
      originalRequestId: r1.id,
      requesterId: emp1.id,
      currentAssignedTo: e3CurrentTo,
      extendedTo: addDays(e3CurrentTo, 30),
      status: ExtensionStatus.rejected,       // enum: ExtensionStatus.rejected
      requiresMgrApproval: true,
      managerId: emp1.managerId,
      mgrApprovalStatus: MgrApprovalStatus.approved,
      managerNote: "Manager approved",
      managerDecidedAt: addHours(e3Decided, -10),
      itDecidedById: itAdmin.id,
      itNote: "Conflict detected: device already re-assigned",
      itDecidedAt: e3Decided,
      createdAt: addDays(e3Decided, -3),
      updatedAt: e3Decided,
    },
  });
  allExtensions.push(e3);
  await logEvent({
    itemId: laptop1.id,
    eventType: "extension_rejected",
    actorId: itAdmin.id,
    actorRole: ActorRole.it_admin,
    requestId: r1.id,
    extensionRequestId: e3.id,
    note: "Extension rejected — device already reallocated",
    isMilestone: false,
    occurredAt: e3Decided,
  });

  console.log(`  Created: ${allExtensions.length} extension requests (approved, pending, rejected)`);

  // ═══════════════════════════════════════════════════════════════════════════
  // 8. SUPPORT REQUESTS
  // Covers all SupportType, SupportStatus, SupportResolution values
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("Seeding support requests…");
  const allSupportRequests: SupportRequest[] = [];

  async function makeSupportRequest(
    item: Item,
    requester: User,
    request: Request | null,
    opts: {
      type: SupportType;
      description: string;
      status: SupportStatus;
      resolution?: SupportResolution | null;
      itNote?: string | null;
      filedDaysAgo?: number;
      resolvedDaysAgo?: number | null;
      autoClosed?: boolean;
    }
  ): Promise<SupportRequest> {
    const filed = past(opts.filedDaysAgo ?? 3);
    const resolvedAt = opts.resolvedDaysAgo != null ? past(opts.resolvedDaysAgo) : null;
    const s = await tx.supportRequest.create({
      data: {
        id: uid(),
        itemId: item.id,
        requesterId: requester.id,
        requestId: request?.id ?? null,
        type: opts.type,
        description: opts.description,
        status: opts.status,
        resolution: opts.resolution ?? null,
        itNote: opts.itNote ?? null,
        swappedToItemId: null,
        filedAt: filed,
        resolvedById: resolvedAt ? itAdmin.id : null,
        resolvedAt,
        autoClosed: opts.autoClosed ?? false,
        createdAt: filed,
        updatedAt: resolvedAt ?? filed,
      },
    });
    allSupportRequests.push(s);
    return s;
  }

  // ── S1: SupportType.damage + SupportStatus.open ───────────────────────────
  const s1 = await makeSupportRequest(laptop2, emp2, r2, {
    type: SupportType.damage,               // enum: SupportType.damage
    description: "Screen cracked after dropping the device",
    status: SupportStatus.open,             // enum: SupportStatus.open
    filedDaysAgo: 2,
  });
  await logEvent({
    itemId: laptop2.id,
    eventType: "support_opened",
    actorId: emp2.id,
    actorRole: ActorRole.employee,
    requestId: r2.id,
    supportRequestId: s1.id,
    note: s1.description,
    isMilestone: true,
    occurredAt: s1.filedAt,
  });

  // ── S2: SupportType.update + SupportStatus.in_progress ───────────────────
  const s2 = await makeSupportRequest(laptop3, emp3, null, {
    type: SupportType.update,               // enum: SupportType.update
    description: "macOS needs updating to latest version",
    status: SupportStatus.in_progress,      // enum: SupportStatus.in_progress
    filedDaysAgo: 4,
  });
  await logEvent({
    itemId: laptop3.id,
    eventType: "support_opened",
    actorId: emp3.id,
    actorRole: ActorRole.employee,
    supportRequestId: s2.id,
    note: s2.description,
    isMilestone: true,
    occurredAt: s2.filedAt,
  });

  // ── S3: SupportType.update + SupportStatus.resolved + SupportResolution.remote_resolved ──
  const s3 = await makeSupportRequest(monitor1, emp3, r3, {
    type: SupportType.update,
    description: "Firmware update required for monitor",
    status: SupportStatus.resolved,         // enum: SupportStatus.resolved
    resolution: SupportResolution.remote_resolved, // enum: SupportResolution.remote_resolved
    itNote: "Remote session completed — firmware updated successfully",
    filedDaysAgo: 15,
    resolvedDaysAgo: 12,
  });
  await logEvent({
    itemId: monitor1.id,
    eventType: "support_opened",
    actorId: emp3.id,
    actorRole: ActorRole.employee,
    requestId: r3.id,
    supportRequestId: s3.id,
    note: s3.description,
    isMilestone: true,
    occurredAt: s3.filedAt,
  });
  await logEvent({
    itemId: monitor1.id,
    eventType: "support_resolved",
    actorId: itAdmin.id,
    actorRole: ActorRole.it_admin,
    requestId: r3.id,
    supportRequestId: s3.id,
    note: "Firmware update completed via remote session",
    isMilestone: true,
    occurredAt: s3.resolvedAt,
  });

  // ── S4: SupportType.damage + SupportStatus.resolved + SupportResolution.repaired_in_place ──
  const s4 = await makeSupportRequest(repairLaptop, emp2, r13, {
    type: SupportType.damage,
    description: "Keyboard intermittently fails — keys not registering",
    status: SupportStatus.resolved,
    resolution: SupportResolution.repaired_in_place, // enum: SupportResolution.repaired_in_place
    itNote: "Keyboard replacement completed in-house",
    filedDaysAgo: 20,
    resolvedDaysAgo: 10,
  });
  await logEvent({
    itemId: repairLaptop.id,
    eventType: "support_opened",
    actorId: emp2.id,
    actorRole: ActorRole.employee,
    requestId: r13.id,
    supportRequestId: s4.id,
    note: s4.description,
    isMilestone: true,
    occurredAt: s4.filedAt,
  });
  await logEvent({
    itemId: repairLaptop.id,
    eventType: "support_resolved",
    actorId: itAdmin.id,
    actorRole: ActorRole.it_admin,
    requestId: r13.id,
    supportRequestId: s4.id,
    note: "Keyboard replaced successfully",
    isMilestone: true,
    occurredAt: s4.resolvedAt,
  });

  // ── S5: SupportType.lost + SupportStatus.resolved + SupportResolution.marked_lost ──
  const s5 = await makeSupportRequest(lostPhone, emp4, null, {
    type: SupportType.lost,                 // enum: SupportType.lost
    description: "Device left in taxi after client meeting — cannot locate",
    status: SupportStatus.resolved,
    resolution: SupportResolution.marked_lost, // enum: SupportResolution.marked_lost
    itNote: "Loss confirmed. Device flagged as lost.",
    filedDaysAgo: 12,
    resolvedDaysAgo: 10,
  });
  await logEvent({
    itemId: lostPhone.id,
    eventType: "support_opened",
    actorId: emp4.id,
    actorRole: ActorRole.employee,
    supportRequestId: s5.id,
    note: s5.description,
    isMilestone: true,
    occurredAt: s5.filedAt,
  });
  await logEvent({
    itemId: lostPhone.id,
    eventType: "support_resolved",
    actorId: itAdmin.id,
    actorRole: ActorRole.it_admin,
    supportRequestId: s5.id,
    note: "Loss confirmed by IT",
    isMilestone: true,
    occurredAt: s5.resolvedAt,
  });

  // ── S6: Auto-closed support (autoClosed = true)
  const s6 = await makeSupportRequest(laptop1, emp1, r1, {
    type: SupportType.update,
    description: "Pending OS update — overdue",
    status: SupportStatus.resolved,
    resolution: SupportResolution.remote_resolved,
    itNote: null,
    autoClosed: true,
    filedDaysAgo: 35,
    resolvedDaysAgo: 30,
  });
  await logEvent({
    itemId: laptop1.id,
    eventType: "support_auto_closed",
    actorId: null,
    actorRole: ActorRole.system,
    requestId: r1.id,
    supportRequestId: s6.id,
    note: "Auto-closed: parent request completed",
    isMilestone: false,
    occurredAt: s6.resolvedAt,
  });

  console.log(`  Created: ${allSupportRequests.length} support requests (all SupportType, SupportStatus & SupportResolution values covered)`);

  // ═══════════════════════════════════════════════════════════════════════════
  // 9. HANDOVER REQUESTS
  // Covers all HandoverStatus values:
  //   requested, accepted, rejected, cancelled, completed
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("Seeding handover requests…");
  const allHandovers: HandoverRequest[] = [];

  async function makeHandover(
    item: Item,
    owner: User,
    borrower: User,
    opts: {
      status: HandoverStatus;
      durationHours: number;
      note?: string | null;
      requestedAt?: Date;
      decidedAt?: Date | null;
      completedAt?: Date | null;
    }
  ): Promise<HandoverRequest> {
    const requestedAt = opts.requestedAt ?? past(3);
    const h = await tx.handoverRequest.create({
      data: {
        id: uid(),
        itemId: item.id,
        ownerId: owner.id,
        borrowerId: borrower.id,
        requestedDurationHours: opts.durationHours,
        status: opts.status,
        requestedAt,
        decidedAt: opts.decidedAt ?? null,
        completedAt: opts.completedAt ?? null,
        note: opts.note ?? null,
        createdAt: requestedAt,
        updatedAt: opts.completedAt ?? opts.decidedAt ?? requestedAt,
      },
    });
    allHandovers.push(h);
    return h;
  }

  // ── H1: HandoverStatus.requested (pending) ────────────────────────────────
  const h1ReqAt = past(1);
  const h1 = await makeHandover(laptop3, emp3, emp1, {
    status: HandoverStatus.requested,       // enum: HandoverStatus.requested
    durationHours: 2,
    note: "Need to demo to client in meeting room",
    requestedAt: h1ReqAt,
  });
  await logEvent({
    itemId: laptop3.id,
    eventType: "handover_requested",
    actorId: emp1.id,
    actorRole: ActorRole.employee,
    handoverRequestId: h1.id,
    note: `${emp1.name} requested handover`,
    isMilestone: false,
    occurredAt: h1ReqAt,
  });

  // ── H2: HandoverStatus.accepted (active borrow) ───────────────────────────
  const h2ReqAt = past(3);
  const h2DecAt = addHours(past(3), 1);
  const h2 = await makeHandover(laptop4, emp4, emp2, {
    status: HandoverStatus.accepted,        // enum: HandoverStatus.accepted
    durationHours: 4,
    note: "Borrowing for afternoon client presentation",
    requestedAt: h2ReqAt,
    decidedAt: h2DecAt,
  });
  await logEvent({
    itemId: laptop4.id,
    eventType: "handover_requested",
    actorId: emp2.id,
    actorRole: ActorRole.employee,
    handoverRequestId: h2.id,
    note: `${emp2.name} requested handover`,
    isMilestone: false,
    occurredAt: h2ReqAt,
  });
  await logEvent({
    itemId: laptop4.id,
    eventType: "handover_accepted",
    actorId: emp4.id,
    actorRole: ActorRole.employee,
    handoverRequestId: h2.id,
    note: `Handover accepted for ${h2.requestedDurationHours} hours`,
    isMilestone: true,
    occurredAt: h2DecAt,
  });

  // ── H3: HandoverStatus.rejected ───────────────────────────────────────────
  const h3ReqAt = past(5);
  const h3DecAt = addHours(past(5), 2);
  const h3 = await makeHandover(phone1, emp1, emp5, {
    status: HandoverStatus.rejected,        // enum: HandoverStatus.rejected
    durationHours: 3,
    note: null,
    requestedAt: h3ReqAt,
    decidedAt: h3DecAt,
  });
  await logEvent({
    itemId: phone1.id,
    eventType: "handover_requested",
    actorId: emp5.id,
    actorRole: ActorRole.employee,
    handoverRequestId: h3.id,
    note: `${emp5.name} requested handover`,
    isMilestone: false,
    occurredAt: h3ReqAt,
  });
  await logEvent({
    itemId: phone1.id,
    eventType: "handover_rejected",
    actorId: emp1.id,
    actorRole: ActorRole.employee,
    handoverRequestId: h3.id,
    note: "Owner declined — device needed for own work",
    isMilestone: false,
    occurredAt: h3DecAt,
  });

  // ── H4: HandoverStatus.cancelled ─────────────────────────────────────────
  const h4ReqAt = past(4);
  const h4 = await makeHandover(laptop3, emp3, emp4, {
    status: HandoverStatus.cancelled,       // enum: HandoverStatus.cancelled
    durationHours: 1,
    note: "No longer needed",
    requestedAt: h4ReqAt,
  });
  await logEvent({
    itemId: laptop3.id,
    eventType: "handover_requested",
    actorId: emp4.id,
    actorRole: ActorRole.employee,
    handoverRequestId: h4.id,
    note: `${emp4.name} requested handover`,
    isMilestone: false,
    occurredAt: h4ReqAt,
  });
  await logEvent({
    itemId: laptop3.id,
    eventType: "handover_cancelled",
    actorId: emp4.id,
    actorRole: ActorRole.employee,
    handoverRequestId: h4.id,
    note: "Borrower cancelled the request",
    isMilestone: false,
    occurredAt: addHours(h4ReqAt, 1),
  });

  // ── H5: HandoverStatus.completed ─────────────────────────────────────────
  const h5ReqAt = past(8);
  const h5DecAt = addHours(past(8), 0.5);
  const h5CompAt = addHours(past(7), 4);
  const h5 = await makeHandover(laptop4, emp4, emp3, {
    status: HandoverStatus.completed,       // enum: HandoverStatus.completed
    durationHours: 3,
    note: "Needed for afternoon workshop",
    requestedAt: h5ReqAt,
    decidedAt: h5DecAt,
    completedAt: h5CompAt,
  });
  await logEvent({
    itemId: laptop4.id,
    eventType: "handover_requested",
    actorId: emp3.id,
    actorRole: ActorRole.employee,
    handoverRequestId: h5.id,
    note: `${emp3.name} requested handover`,
    isMilestone: false,
    occurredAt: h5ReqAt,
  });
  await logEvent({
    itemId: laptop4.id,
    eventType: "handover_accepted",
    actorId: emp4.id,
    actorRole: ActorRole.employee,
    handoverRequestId: h5.id,
    note: "Handover accepted",
    isMilestone: true,
    occurredAt: h5DecAt,
  });
  await logEvent({
    itemId: laptop4.id,
    eventType: "handover_completed",
    actorId: emp4.id,
    actorRole: ActorRole.employee,
    handoverRequestId: h5.id,
    note: "Device returned to owner",
    isMilestone: true,
    occurredAt: h5CompAt,
  });

  console.log(`  Created: ${allHandovers.length} handover requests (all HandoverStatus values covered)`);

  // ═══════════════════════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════════════════════
  console.log("\n✓ Seed complete. Summary:");
  console.log(`  Users:            (1 IT admin — ${itAdmin.name}, 2 managers, 5 employees)`);
  console.log(`  Item categories:  ${Object.keys(categories).length.toString().padStart(3)} (all categories including inactive)`);
  console.log(`  Devices (items):  ${allItems.length.toString().padStart(3)} (all DeviceStatus + OwnerType values covered)`);
  console.log(`  Requests:         ${allRequests.length.toString().padStart(3)} (all RequestStatus, Priority, MgrApprovalStatus, RejectedBy values covered)`);
  console.log(`  Extension reqs:   ${allExtensions.length.toString().padStart(3)} (approved, pending, rejected)`);
  console.log(`  Support reqs:     ${allSupportRequests.length.toString().padStart(3)} (all SupportType, SupportStatus, SupportResolution values covered)`);
  console.log(`  Handover reqs:    ${allHandovers.length.toString().padStart(3)} (all HandoverStatus values covered)`);
  console.log(`  Device log rows:  see DB — one per event`);
  console.log("\n  Enums fully covered:");
  console.log("    UserRole:          it_admin, manager, employee");
  console.log("    OwnerType:         company, client");
  console.log("    DeviceStatus:      available, assigned, under_repair, maintenance, lost, retired, shipping_pending, return_shipping_pending");
  console.log("    RequestStatus:     requested, pending_mgr_approval, pending_it_approval, assigned, completed, rejected, cancelled");
  console.log("    RequestPriority:   low, medium, high");
  console.log("    MgrApprovalStatus: not_required, pending, approved, rejected");
  console.log("    RejectedBy:        manager, it_admin");
  console.log("    ExtensionStatus:   pending, approved, rejected");
  console.log("    SupportType:       update, damage, lost");
  console.log("    SupportStatus:     open, in_progress, resolved");
  console.log("    SupportResolution: remote_resolved, repaired_in_place, marked_lost");
  console.log("    HandoverStatus:    requested, accepted, rejected, cancelled, completed");
  console.log("    ActorRole:         it_admin, manager, employee, system");

  // Keep TS happy — suppress unused-variable warnings for type imports
  void allUsers;
  void r6; void r7; void r8; void r9; void r10; void r11;
}

// ── Entry point ──────────────────────────────────────────────────────────────
async function main() {
  console.log("Connecting to database…");
  await prisma.$transaction(
    async (tx) => { await runSeed(tx); },
    { maxWait: 30_000, timeout: 120_000 }
  );
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
