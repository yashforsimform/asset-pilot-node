// prisma/seed_generated.ts
// Generated seed script – deterministic, comprehensive data for all tables.
// Uses the same utilities as the original seed.ts but expands categories, items,
// requests, support, extension, handover, and device‑log records.
// Run with: `npx prisma db seed --preview-feature --seed=prisma/seed_generated.ts`

import 'dotenv/config';
import { randomUUID } from 'crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
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
} from '@prisma/client';

const connectionString = process.env['DATABASE_URL'];
if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
}
const databaseUrl = new URL(connectionString);
const isLocalDatabase = ['localhost', '127.0.0.1', '::1'].includes(
    databaseUrl.hostname,
);
const pool = new Pool({
    connectionString,
    ssl: isLocalDatabase ? false : { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ---------- Deterministic PRNG (seed 42) ----------
function mulberry32(seed: number) {
    let a = seed;
    return function random(): number {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
const rand = mulberry32(42);
function randomInt(min: number, max: number): number {
    return Math.floor(rand() * (max - min + 1)) + min;
}
function randomFloat(): number {
    return rand();
}
function pick<T>(list: readonly T[]): T {
    const value = list[Math.floor(rand() * list.length)];
    if (value === undefined) {
        throw new Error('Cannot pick from an empty list');
    }
    return value;
}
function sample<T>(list: readonly T[], n: number): T[] {
    const pool = [...list];
    const result: T[] = [];
    for (let i = 0; i < Math.min(n, pool.length); i++) {
        const idx = Math.floor(rand() * pool.length);
        const value = pool.splice(idx, 1)[0];
        if (value !== undefined) {
            result.push(value);
        }
    }
    return result;
}
function uid(): string {
    return randomUUID();
}
function now(): Date {
    return new Date();
}
function past(days: number, hours = 0): Date {
    const d = new Date();
    d.setDate(d.getDate() - days);
    d.setHours(d.getHours() - hours);
    return d;
}
function future(days: number, hours = 0): Date {
    const d = new Date();
    d.setDate(d.getDate() + days);
    d.setHours(d.getHours() + hours);
    return d;
}
function dateOnly(date: Date): Date {
    return new Date(date.toISOString().slice(0, 10));
}

// ---------- Static data (names, models, etc.) ----------
const FIRST_NAMES = [
    'Alice',
    'Bob',
    'Carol',
    'David',
    'Emma',
    'Frank',
    'Grace',
    'Henry',
    'Isabella',
    'Jack',
    'Karen',
    'Leo',
    'Mia',
    'Noah',
    'Olivia',
    'Paul',
    'Quinn',
    'Rachel',
    'Sam',
    'Tina',
    'Uma',
    'Victor',
    'Wendy',
    'Xander',
    'Yasmine',
    'Zach',
];
const LAST_NAMES = [
    'Smith',
    'Johnson',
    'Williams',
    'Brown',
    'Jones',
    'Garcia',
    'Miller',
    'Davis',
    'Wilson',
    'Anderson',
    'Taylor',
    'Thomas',
    'Moore',
    'Martin',
    'Jackson',
    'Lee',
    'Perez',
    'Thompson',
    'White',
    'Harris',
    'Clark',
    'Lewis',
    'Robinson',
    'Walker',
    'Hall',
    'Young',
    'Allen',
    'King',
    'Wright',
    'Scott',
    'Torres',
    'Nguyen',
    'Hill',
    'Flores',
    'Green',
];

function makeName(): string {
    return `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
}
function makeEmail(name: string): string {
    const parts = name.toLowerCase().split(' ');
    return `${parts[0]}.${parts[1]}@example.com`;
}
function makeSerial(): string {
    return `SN-${randomInt(100000, 999999)}`;
}

// ---------- Custom categories ----------
const CATEGORY_DEFS: Array<
    [name: string, description: string, requiresMgr: boolean, isActive: boolean]
> = [
    ['Laptop', 'Company laptops', true, true],
    ['Mobile Phone', 'Company smartphones', true, true],
    ['Monitor', 'External displays', false, true],
    ['Keyboard', 'Keyboards (mechanical/membrane)', false, true],
    ['Mouse', 'Mice (wired/wireless)', false, true],
    ['Headset', 'Headsets and earphones', false, true],
    ['iPhone X', 'Apple iPhone X series', true, true],
    ['iPhone 11', 'Apple iPhone 11 series', true, true],
    ['iPhone 12', 'Apple iPhone 12 series', true, true],
    ['iPhone 13', 'Apple iPhone 13 series', true, true],
    ['iPhone 14', 'Apple iPhone 14 series', true, true],
    ['Android Phone', 'Google/ Samsung Android devices', true, true],
    ['Custom Kiosk Scanner', 'Client‑specific kiosk scanner', false, true],
    ['Billing Device', 'Point‑of‑sale billing hardware', false, true],
];

// ---------- Device model lists ----------
const LAPTOP_MODELS = [
    'MacBook Pro 14',
    'MacBook Pro 16',
    'Dell XPS 13',
    'Dell Latitude 7440',
    'HP EliteBook 860',
    'Lenovo ThinkPad X1 Carbon',
];
const PHONE_MODELS = [
    'iPhone X',
    'iPhone 11',
    'iPhone 12',
    'iPhone 13',
    'iPhone 14',
    'Samsung Galaxy S24',
    'Google Pixel 8',
];
const MONITOR_MODELS = [
    'Dell UltraSharp 27',
    'LG UltraFine 27',
    'Apple Pro Display XDR',
];
const KEYBOARD_MODELS = [
    'Apple Magic Keyboard',
    'Logitech MX Keys',
    'Keychron K3 Proa',
];
const MOUSE_MODELS = [
    'Apple Magic Mouse',
    'Logitech MX Master 3S',
    'Razer DeathAdder V3',
];
const HEADSET_MODELS = [
    'Sony WH‑1000XM5',
    'Bose QuietComfort 45',
    'Apple AirPods Pro',
];
const CUSTOM_KIOSK_MODELS = ['KioskPro 3000', 'ScanMaster Ultra'];
const BILLING_DEVICE_MODELS = ['POS Terminal X1', 'Cashier Pro 200'];

// ---------- Helper for logging device events ----------
interface LogOpts {
    itemId: string;
    eventType: DeviceLogEvent;
    actorId?: string | null;
    actorRole: ActorRole;
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
async function logEvent(opts: LogOpts) {
    await prisma.deviceLog.create({
        data: {
            id: uid(),
            itemId: opts.itemId,
            eventType: opts.eventType,
            actorId: opts.actorId ?? null,
            actorRole: opts.actorRole,
            requestId: opts.requestId ?? null,
            supportRequestId: opts.supportRequestId ?? null,
            extensionRequestId: opts.extensionRequestId ?? null,
            handoverRequestId: opts.handoverRequestId ?? null,
            fromValue: opts.fromValue ?? null,
            toValue: opts.toValue ?? null,
            note: opts.note ?? null,
            metadata: (opts.metadata ?? {}) as Prisma.InputJsonValue,
            isMilestone: opts.isMilestone ?? false,
            occurredAt: opts.occurredAt ?? now(),
            createdAt: now(),
            updatedAt: now(),
        },
    });
}

async function main() {
    // Truncate all tables – same as original seed
    console.log('Truncating tables…');
    await prisma.$executeRawUnsafe(`
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

    // ---------- USERS ----------
    console.log('Seeding users…');
    const managers: User[] = [];
    const itAdmins: User[] = [];
    const employees: User[] = [];
    // 2 managers
    for (let i = 0; i < 2; i++) {
        const name = makeName();
        const u = await prisma.user.create({
            data: {
                id: uid(),
                name,
                email: makeEmail(name),
                role: UserRole.manager,
                managerId: null,
                isActive: true,
                createdAt: past(randomInt(60, 180)),
                updatedAt: past(randomInt(1, 15)),
            },
        });
        managers.push(u);
    }
    // 2 IT admins
    for (let i = 0; i < 2; i++) {
        const name = makeName();
        const u = await prisma.user.create({
            data: {
                id: uid(),
                name,
                email: makeEmail(name),
                role: UserRole.it_admin,
                managerId: null,
                isActive: true,
                createdAt: past(randomInt(60, 180)),
                updatedAt: past(randomInt(1, 15)),
            },
        });
        itAdmins.push(u);
    }
    // 6 employees, each linked to a random manager
    for (let i = 0; i < 6; i++) {
        const name = makeName();
        const mgr = pick(managers);
        const u = await prisma.user.create({
            data: {
                id: uid(),
                name,
                email: makeEmail(name),
                role: UserRole.employee,
                managerId: mgr.id,
                isActive: true,
                createdAt: past(randomInt(30, 180)),
                updatedAt: past(randomInt(1, 15)),
            },
        });
        employees.push(u);
    }
    const allUsers = [...managers, ...itAdmins, ...employees];
    const activeEmployees = employees.filter((e) => e.isActive);
    const primaryItAdmin = pick(itAdmins);

    // ---------- ITEM CATEGORIES ----------
    console.log('Seeding item categories…');
    const categories: Record<string, ItemCategory> = {};
    for (const [name, desc, reqMgr, active] of CATEGORY_DEFS) {
        const cat = await prisma.itemCategory.create({
            data: {
                id: uid(),
                name,
                description: desc,
                requiresMgrApproval: reqMgr,
                isActive: active,
                createdAt: past(200),
                updatedAt: past(5),
            },
        });
        categories[name] = cat;
    }
    const getCat = (name: string): ItemCategory => {
        const category = categories[name];
        if (!category) {
            throw new Error(`Category not seeded: ${name}`);
        }
        return category;
    };

    // ---------- ITEMS ----------
    console.log('Seeding items…');
    const items: Item[] = [];

    async function createItem(
        name: string,
        categoryName: string,
        status: DeviceStatus = DeviceStatus.available,
        ownerType: OwnerType = OwnerType.company,
        clientName: string | null = null,
        ownerId: string | null = null,
    ) {
        const cat = getCat(categoryName);
        const item = await prisma.item.create({
            data: {
                id: uid(),
                name,
                serialNo: makeSerial(),
                categoryId: cat.id,
                ownerType,
                clientName,
                status,
                currentOwnerId: ownerId,
                purchaseDate: dateOnly(past(randomInt(30, 730))),
                qrCodeToken: uid(),
                createdAt: past(randomInt(30, 730)),
                updatedAt: now(),
            },
        });
        items.push(item);
        // initial log entry
        await logEvent({
            itemId: item.id,
            eventType: 'device_created',
            actorId: primaryItAdmin.id,
            actorRole: ActorRole.it_admin,
            toValue: status,
            note: `Added ${name}`,
            occurredAt: item.createdAt,
        });
        return item;
    }

    // Helper to pick a random employee for ownership
    const randomEmployee = () => pick(activeEmployees);

    // Laptops
    for (const model of sample(LAPTOP_MODELS, 12)) {
        await createItem(model, 'Laptop');
    }
    // Mobile Phones (including iPhone series & Android)
    for (const model of sample(PHONE_MODELS, 12)) {
        await createItem(model, 'Mobile Phone');
    }
    // iPhone specific categories – one item each to illustrate custom categories
    for (const catName of [
        'iPhone X',
        'iPhone 11',
        'iPhone 12',
        'iPhone 13',
        'iPhone 14',
    ]) {
        await createItem(`${catName} – ${pick(PHONE_MODELS)}`, catName);
    }
    // Android phones
    await createItem(
        'Android Phone – Samsung Galaxy S24 Ultra',
        'Android Phone',
    );
    // Monitors
    for (const model of sample(MONITOR_MODELS, 8)) {
        await createItem(model, 'Monitor');
    }
    // Keyboards
    for (const model of sample(KEYBOARD_MODELS, 8)) {
        await createItem(model, 'Keyboard');
    }
    // Mice
    for (const model of sample(MOUSE_MODELS, 8)) {
        await createItem(model, 'Mouse');
    }
    // Headsets
    for (const model of sample(HEADSET_MODELS, 6)) {
        await createItem(model, 'Headset');
    }
    // Custom kiosk scanners
    for (const model of sample(CUSTOM_KIOSK_MODELS, 3)) {
        await createItem(
            model,
            'Custom Kiosk Scanner',
            DeviceStatus.assigned,
            OwnerType.client,
            'Acme Corp',
            randomEmployee().id,
        );
    }
    // Billing devices
    for (const model of sample(BILLING_DEVICE_MODELS, 3)) {
        await createItem(
            model,
            'Billing Device',
            DeviceStatus.assigned,
            OwnerType.client,
            'GlobalFinance Inc',
            randomEmployee().id,
        );
    }

    // ---------- REQUESTS (60‑80) ----------
    console.log('Seeding requests…');
    const allRequests: Request[] = [];
    const statuses: RequestStatus[] = [
        RequestStatus.requested,
        RequestStatus.pending_mgr_approval,
        RequestStatus.pending_it_approval,
        RequestStatus.assigned,
        RequestStatus.completed,
        RequestStatus.rejected,
        RequestStatus.cancelled,
    ];
    const priorities: RequestPriority[] = [
        RequestPriority.low,
        RequestPriority.medium,
        RequestPriority.high,
    ];

    for (let i = 0; i < 70; i++) {
        const requester = pick(activeEmployees);
        const category = pick(Object.keys(categories));
        const categoryRecord = getCat(category);
        const status = pick(statuses);
        const priority = pick(priorities);
        const reqFrom = past(randomInt(30, 120));
        const reqTo = future(randomInt(7, 30));
        const assignedItem =
            status === RequestStatus.assigned ||
            status === RequestStatus.completed
                ? pick(
                      items.filter(
                          (it) => it.status === DeviceStatus.available,
                      ),
                  )
                : null;
        // If we assign an item, update its status & owner
        if (assignedItem) {
            await prisma.item.update({
                where: { id: assignedItem.id },
                data: {
                    status: DeviceStatus.assigned,
                    currentOwnerId: requester.id,
                },
            });
            await logEvent({
                itemId: assignedItem.id,
                eventType: 'assigned',
                actorId: primaryItAdmin.id,
                actorRole: ActorRole.it_admin,
                toValue: 'assigned',
                note: `Assigned to ${requester.name}`,
                occurredAt: now(),
            });
        }
        const request = await prisma.request.create({
            data: {
                id: uid(),
                requesterId: requester.id,
                categoryId: categoryRecord.id,
                assignedItemId: assignedItem?.id ?? null,
                requestedFrom: reqFrom,
                requestedTo: reqTo,
                assignedFrom: assignedItem ? now() : null,
                assignedTo: assignedItem ? future(randomInt(7, 30)) : null,
                status,
                priority,
                note: pick([
                    'Need for client demo',
                    'Upgrade needed',
                    'New hire',
                    null,
                    null,
                ]),
                requiresMgrApproval: categoryRecord.requiresMgrApproval,
                mgrApprovalStatus:
                    status === RequestStatus.pending_mgr_approval
                        ? MgrApprovalStatus.pending
                        : MgrApprovalStatus.not_required,
                managerId: requester.managerId ?? null,
                itDecidedById:
                    status === RequestStatus.completed
                        ? primaryItAdmin.id
                        : null,
                completedAt: status === RequestStatus.completed ? now() : null,
                createdAt: past(randomInt(5, 30)),
                updatedAt: now(),
            },
        });
        allRequests.push(request);
    }

    // ---------- SUPPORT REQUESTS ----------
    console.log('Seeding support requests...');
    const supportTypes: SupportType[] = [
        SupportType.update,
        SupportType.damage,
        SupportType.lost,
    ];
    const supportStatuses: SupportStatus[] = [
        SupportStatus.open,
        SupportStatus.in_progress,
        SupportStatus.resolved,
    ];
    const supportDescriptions = {
        update: [
            'macOS needs latest security update',
            'Chrome and Slack are outdated',
            'Firmware patch required',
        ],
        damage: [
            'Screen cracked after drop',
            'Keyboard keys sticky',
            'Charging port loose',
        ],
        lost: [
            'Device left in taxi',
            'Stolen from desk',
            'Lost after office move',
        ],
    };

    for (let i = 0; i < 30; i++) {
        const requester = pick(activeEmployees);
        const item = pick(items);
        const type = pick(supportTypes);
        const description = pick(supportDescriptions[type]);
        await prisma.supportRequest.create({
            data: {
                id: uid(),
                itemId: item.id,
                requesterId: requester.id,
                type,
                description,
                status: pick(supportStatuses),
                resolution: SupportResolution.remote_resolved,
                filedAt: past(randomInt(1, 20)),
                createdAt: now(),
                updatedAt: now(),
            },
        });
        await logEvent({
            itemId: item.id,
            eventType: 'support_opened',
            actorId: primaryItAdmin.id,
            actorRole: ActorRole.it_admin,
            note: `Support (${type}) opened: ${description}`,
        });
    }

    // ---------- EXTENSION REQUESTS ----------
    console.log('Seeding extension requests…');
    const extStatuses: ExtensionStatus[] = [
        ExtensionStatus.pending,
        ExtensionStatus.approved,
        ExtensionStatus.rejected,
    ];
    for (let i = 0; i < 15; i++) {
        const originalRequest = pick(allRequests);
        const requester = pick(activeEmployees);
        const newTo = future(randomInt(7, 30));
        await prisma.extensionRequest.create({
            data: {
                id: uid(),
                originalRequestId: originalRequest.id,
                requesterId: requester.id,
                currentAssignedTo: originalRequest.assignedTo ?? now(),
                extendedTo: newTo,
                status: pick(extStatuses),
                requiresMgrApproval: false,
                createdAt: now(),
                updatedAt: now(),
            },
        });
    }

    // ---------- HANDOVER REQUESTS ----------
    console.log('Seeding handover requests…');
    const handoverStatuses: HandoverStatus[] = [
        HandoverStatus.requested,
        HandoverStatus.accepted,
        HandoverStatus.rejected,
        HandoverStatus.cancelled,
        HandoverStatus.completed,
    ];
    for (let i = 0; i < 12; i++) {
        const item = pick(items);
        const owner = pick(activeEmployees);
        const borrower = pick(activeEmployees.filter((e) => e.id !== owner.id));
        await prisma.handoverRequest.create({
            data: {
                id: uid(),
                itemId: item.id,
                ownerId: owner.id,
                borrowerId: borrower.id,
                status: pick(handoverStatuses),
                requestedAt: past(randomInt(5, 20)),
                createdAt: now(),
                updatedAt: now(),
            },
        });
        await logEvent({
            itemId: item.id,
            eventType: 'handover_requested',
            actorId: owner.id,
            actorRole: ActorRole.employee,
            note: `Owner ${owner.name} requested handover to ${borrower.name}`,
        });
    }

    console.log('Seed generation complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
