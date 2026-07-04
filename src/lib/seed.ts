import { prisma } from "./prisma";

const employeeId = "11111111-1111-1111-1111-111111111111";
const managerId = "22222222-2222-2222-2222-222222222222";
const itAdminId = "33333333-3333-3333-3333-333333333333";

export async function seedDatabase(): Promise<void> {
  if (process.env.SEED_DB !== "true") {
    return;
  }

  try {
    const manager = await prisma.user.upsert({
      where: { id: managerId },
      update: {},
      create: {
        id: managerId,
        name: "Alex Manager",
        email: "alex.manager@example.com",
        role: "manager",
        isActive: true,
      },
    });

    const employee = await prisma.user.upsert({
      where: { id: employeeId },
      update: {},
      create: {
        id: employeeId,
        name: "Jordan Employee",
        email: "jordan.employee@example.com",
        role: "employee",
        managerId: manager.id,
        isActive: true,
      },
    });

    await prisma.user.upsert({
      where: { id: itAdminId },
      update: {},
      create: {
        id: itAdminId,
        name: "Sam IT",
        email: "sam.it@example.com",
        role: "it_admin",
        isActive: true,
      },
    });

    const category = await prisma.itemCategory.upsert({
      where: { name: "Laptop" },
      update: {},
      create: {
        name: "Laptop",
        description: "Standard business laptop",
        requiresMgrApproval: true,
        isActive: true,
      },
    });

    const item = await prisma.item.upsert({
      where: { serialNo: "SN-1001" },
      update: {},
      create: {
        name: "MacBook Pro",
        serialNo: "SN-1001",
        categoryId: category.id,
        ownerType: "company",
        status: "assigned",
        currentOwnerId: employee.id,
        qrCodeToken: "00000000-0000-0000-0000-000000000001",
      },
    });

    await prisma.request.upsert({
      where: { id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa" },
      update: {},
      create: {
        id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        requesterId: employee.id,
        managerId: manager.id,
        categoryId: category.id,
        assignedItemId: item.id,
        requestedFrom: new Date("2026-07-01"),
        requestedTo: new Date("2026-07-10"),
        priority: "high",
        note: "Seeded request for manual validation",
        isWfh: false,
        requiresMgrApproval: true,
        mgrApprovalStatus: "pending",
        status: "assigned",
        assignedFrom: new Date("2026-07-01"),
        assignedTo: new Date("2026-07-10"),
      },
    });
  } catch (error) {
    console.warn("Seed data could not be initialized; continuing with empty data.", error);
  }
}
