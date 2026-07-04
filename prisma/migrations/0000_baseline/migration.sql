-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('employee', 'manager', 'it_admin');

-- CreateEnum
CREATE TYPE "request_status" AS ENUM ('requested', 'pending_mgr_approval', 'pending_it_approval', 'assigned', 'completed', 'rejected', 'cancelled');

-- CreateEnum
CREATE TYPE "mgr_approval_status" AS ENUM ('not_required', 'pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "request_priority" AS ENUM ('low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "device_status" AS ENUM ('available', 'assigned', 'shipping_pending', 'return_shipping_pending', 'under_repair', 'maintenance', 'lost', 'retired', 'returned_to_client');

-- CreateEnum
CREATE TYPE "owner_type" AS ENUM ('company', 'client');

-- CreateEnum
CREATE TYPE "support_type" AS ENUM ('update', 'damage', 'lost');

-- CreateEnum
CREATE TYPE "support_status" AS ENUM ('open', 'in_progress', 'resolved');

-- CreateEnum
CREATE TYPE "support_resolution" AS ENUM ('remote_resolved', 'repaired_in_place', 'swapped', 'marked_lost');

-- CreateEnum
CREATE TYPE "extension_status" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "handover_status" AS ENUM ('requested', 'accepted', 'rejected', 'cancelled', 'completed');

-- CreateEnum
CREATE TYPE "device_log_event" AS ENUM ('device_created', 'device_edited', 'assigned', 'client_assigned', 'ship_outbound_initiated', 'ship_outbound_completed', 'return_ship_initiated', 'return_received', 'assignment_completed', 'status_changed', 'support_opened', 'support_resolved', 'support_auto_closed', 'extension_requested', 'extension_approved', 'extension_rejected', 'handover_requested', 'handover_accepted', 'handover_rejected', 'handover_cancelled', 'handover_completed', 'marked_lost', 'retired', 'returned_to_client');

-- CreateEnum
CREATE TYPE "actor_role" AS ENUM ('employee', 'manager', 'it_admin', 'system');

-- CreateEnum
CREATE TYPE "rejected_by_enum" AS ENUM ('manager', 'it_admin', 'it_admin_cancel');

-- CreateTable
CREATE TABLE "user" (
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "manager_id" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" UUID NOT NULL,
    "role" "user_role" NOT NULL DEFAULT 'employee',
    "password_hash" TEXT,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_category" (
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "requires_mgr_approval" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" UUID NOT NULL,

    CONSTRAINT "item_category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item" (
    "name" VARCHAR(255) NOT NULL,
    "category_id" UUID NOT NULL,
    "client_name" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "current_owner_id" UUID,
    "owner_type" "owner_type" NOT NULL DEFAULT 'company',
    "purchase_date" DATE,
    "qr_code_token" UUID NOT NULL,
    "serial_no" VARCHAR(255) NOT NULL,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" UUID NOT NULL,
    "status" "device_status" NOT NULL DEFAULT 'available',

    CONSTRAINT "item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "request" (
    "note" TEXT,
    "assigned_from" TIMESTAMPTZ(6),
    "assigned_item_id" UUID,
    "assigned_to" TIMESTAMPTZ(6),
    "cancelled_at" TIMESTAMPTZ(6),
    "cancelled_by" UUID,
    "category_id" UUID NOT NULL,
    "completed_at" TIMESTAMPTZ(6),
    "completed_by" UUID,
    "completed_next_status" "device_status",
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_client_direct" BOOLEAN NOT NULL DEFAULT false,
    "is_wfh" BOOLEAN NOT NULL DEFAULT false,
    "it_decided_at" TIMESTAMPTZ(6),
    "it_decided_by" UUID,
    "it_decision_note" TEXT,
    "manager_decided_at" TIMESTAMPTZ(6),
    "manager_decision_note" TEXT,
    "manager_id" UUID,
    "mgr_approval_status" "mgr_approval_status" NOT NULL DEFAULT 'not_required',
    "rejected_by" "rejected_by_enum",
    "rejected_reason" TEXT,
    "requested_from" TIMESTAMPTZ(6) NOT NULL,
    "requested_to" TIMESTAMPTZ(6) NOT NULL,
    "requester_id" UUID NOT NULL,
    "requires_mgr_approval" BOOLEAN NOT NULL DEFAULT false,
    "return_initiated_at" TIMESTAMPTZ(6),
    "return_tracking_url" TEXT,
    "ship_completed_at" TIMESTAMPTZ(6),
    "ship_initiated_at" TIMESTAMPTZ(6),
    "ship_tracking_url" TEXT,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" UUID NOT NULL,
    "priority" "request_priority" NOT NULL DEFAULT 'medium',
    "status" "request_status" NOT NULL DEFAULT 'requested',

    CONSTRAINT "request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "extension_request" (
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "current_assigned_to" TIMESTAMPTZ(6) NOT NULL,
    "extended_to" TIMESTAMPTZ(6) NOT NULL,
    "it_decided_at" TIMESTAMPTZ(6),
    "it_decided_by" UUID,
    "it_note" TEXT,
    "manager_decided_at" TIMESTAMPTZ(6),
    "manager_id" UUID,
    "manager_note" TEXT,
    "mgr_approval_status" "mgr_approval_status" NOT NULL DEFAULT 'not_required',
    "original_request_id" UUID NOT NULL,
    "requester_id" UUID NOT NULL,
    "requires_mgr_approval" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" UUID NOT NULL,
    "status" "extension_status" NOT NULL DEFAULT 'pending',

    CONSTRAINT "extension_request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "handover_request" (
    "note" TEXT,
    "borrower_id" UUID NOT NULL,
    "completed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decided_at" TIMESTAMPTZ(6),
    "item_id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "requested_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requested_duration_hours" INTEGER,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" UUID NOT NULL,
    "status" "handover_status" NOT NULL DEFAULT 'requested',

    CONSTRAINT "handover_request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_request" (
    "description" TEXT NOT NULL,
    "auto_closed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "filed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "it_note" TEXT,
    "item_id" UUID NOT NULL,
    "request_id" UUID,
    "requester_id" UUID NOT NULL,
    "resolved_at" TIMESTAMPTZ(6),
    "resolved_by" UUID,
    "swapped_to_item_id" UUID,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" UUID NOT NULL,
    "type" "support_type" NOT NULL,
    "status" "support_status" NOT NULL DEFAULT 'open',
    "resolution" "support_resolution",

    CONSTRAINT "support_request_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_log" (
    "note" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "actor_id" UUID,
    "actor_role" "actor_role" NOT NULL,
    "event_type" "device_log_event" NOT NULL,
    "extension_request_id" UUID,
    "from_value" TEXT,
    "handover_request_id" UUID,
    "is_milestone" BOOLEAN NOT NULL DEFAULT false,
    "item_id" UUID NOT NULL,
    "occurred_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "request_id" UUID,
    "support_request_id" UUID,
    "to_value" TEXT,
    "id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "passwordHash" TEXT,

    CONSTRAINT "device_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE INDEX "user_manager_id_idx" ON "user"("manager_id");

-- CreateIndex
CREATE INDEX "user_role_idx" ON "user"("role");

-- CreateIndex
CREATE UNIQUE INDEX "item_category_name_key" ON "item_category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "item_qr_code_token_key" ON "item"("qr_code_token");

-- CreateIndex
CREATE UNIQUE INDEX "item_serial_no_key" ON "item"("serial_no");

-- CreateIndex
CREATE INDEX "item_status_idx" ON "item"("status");

-- CreateIndex
CREATE INDEX "item_category_id_idx" ON "item"("category_id");

-- CreateIndex
CREATE INDEX "item_current_owner_id_idx" ON "item"("current_owner_id");

-- CreateIndex
CREATE INDEX "idx_item_available_by_category" ON "item"("category_id", "status");

-- CreateIndex
CREATE INDEX "request_requester_id_idx" ON "request"("requester_id");

-- CreateIndex
CREATE INDEX "request_status_idx" ON "request"("status");

-- CreateIndex
CREATE INDEX "request_assigned_item_id_idx" ON "request"("assigned_item_id");

-- CreateIndex
CREATE INDEX "request_category_id_idx" ON "request"("category_id");

-- CreateIndex
CREATE INDEX "idx_request_it_queue" ON "request"("priority", "created_at");

-- CreateIndex
CREATE INDEX "idx_request_item_status" ON "request"("assigned_item_id", "status");

-- CreateIndex
CREATE INDEX "idx_request_date_range" ON "request"("assigned_item_id", "assigned_from", "assigned_to");

-- CreateIndex
CREATE INDEX "handover_request_item_id_idx" ON "handover_request"("item_id");

-- CreateIndex
CREATE INDEX "handover_request_borrower_id_idx" ON "handover_request"("borrower_id");

-- CreateIndex
CREATE INDEX "handover_request_owner_id_idx" ON "handover_request"("owner_id");

-- CreateIndex
CREATE INDEX "idx_handover_item_status" ON "handover_request"("item_id", "status");

-- CreateIndex
CREATE INDEX "support_request_item_id_idx" ON "support_request"("item_id");

-- CreateIndex
CREATE INDEX "support_request_status_idx" ON "support_request"("status");

-- CreateIndex
CREATE INDEX "support_request_request_id_idx" ON "support_request"("request_id");

-- CreateIndex
CREATE INDEX "idx_support_open_queue" ON "support_request"("filed_at");

-- CreateIndex
CREATE INDEX "idx_device_log_item_time" ON "device_log"("item_id", "occurred_at");

-- CreateIndex
CREATE INDEX "idx_device_log_milestones" ON "device_log"("item_id", "occurred_at");

-- CreateIndex
CREATE INDEX "device_log_request_id_idx" ON "device_log"("request_id");

-- CreateIndex
CREATE INDEX "device_log_event_type_idx" ON "device_log"("event_type");

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item" ADD CONSTRAINT "item_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "item_category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item" ADD CONSTRAINT "item_current_owner_id_fkey" FOREIGN KEY ("current_owner_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request" ADD CONSTRAINT "request_assigned_item_id_fkey" FOREIGN KEY ("assigned_item_id") REFERENCES "item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request" ADD CONSTRAINT "request_cancelled_by_fkey" FOREIGN KEY ("cancelled_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request" ADD CONSTRAINT "request_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "item_category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request" ADD CONSTRAINT "request_completed_by_fkey" FOREIGN KEY ("completed_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request" ADD CONSTRAINT "request_it_decided_by_fkey" FOREIGN KEY ("it_decided_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request" ADD CONSTRAINT "request_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "request" ADD CONSTRAINT "request_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extension_request" ADD CONSTRAINT "extension_request_it_decided_by_fkey" FOREIGN KEY ("it_decided_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extension_request" ADD CONSTRAINT "extension_request_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extension_request" ADD CONSTRAINT "extension_request_original_request_id_fkey" FOREIGN KEY ("original_request_id") REFERENCES "request"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extension_request" ADD CONSTRAINT "extension_request_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "handover_request" ADD CONSTRAINT "handover_request_borrower_id_fkey" FOREIGN KEY ("borrower_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "handover_request" ADD CONSTRAINT "handover_request_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "handover_request" ADD CONSTRAINT "handover_request_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_request" ADD CONSTRAINT "support_request_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_request" ADD CONSTRAINT "support_request_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "request"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_request" ADD CONSTRAINT "support_request_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_request" ADD CONSTRAINT "support_request_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_request" ADD CONSTRAINT "support_request_swapped_to_item_id_fkey" FOREIGN KEY ("swapped_to_item_id") REFERENCES "item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_log" ADD CONSTRAINT "device_log_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_log" ADD CONSTRAINT "device_log_extension_request_id_fkey" FOREIGN KEY ("extension_request_id") REFERENCES "extension_request"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_log" ADD CONSTRAINT "device_log_handover_request_id_fkey" FOREIGN KEY ("handover_request_id") REFERENCES "handover_request"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_log" ADD CONSTRAINT "device_log_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_log" ADD CONSTRAINT "device_log_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "request"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "device_log" ADD CONSTRAINT "device_log_support_request_id_fkey" FOREIGN KEY ("support_request_id") REFERENCES "support_request"("id") ON DELETE SET NULL ON UPDATE CASCADE;

