-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "merchants" (
    "address" TEXT NOT NULL,
    "name" TEXT,
    "webhookUrl" TEXT,
    "webhookSecret" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "merchants_pkey" PRIMARY KEY ("address")
);

-- CreateTable
CREATE TABLE "pay_links" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "merchantAddress" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'single_item',
    "amount" DOUBLE PRECISION,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "views" INTEGER NOT NULL DEFAULT 0,
    "redirectUrl" TEXT,
    "collectEmail" BOOLEAN NOT NULL DEFAULT false,
    "collectDiscord" BOOLEAN NOT NULL DEFAULT false,
    "customNote" TEXT,
    "affiliateAddress" TEXT,
    "affiliateBps" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pay_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pay_link_plans" (
    "id" TEXT NOT NULL,
    "payLinkId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tag" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "interval" TEXT DEFAULT 'month',
    "description" TEXT,
    "features" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pay_link_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settlements" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "merchantAddress" TEXT NOT NULL,
    "payerAddress" TEXT,
    "payLinkId" TEXT,
    "planId" TEXT,
    "gross" TEXT NOT NULL,
    "protocolFee" TEXT NOT NULL,
    "merchantShare" TEXT NOT NULL,
    "affiliateShare" TEXT,
    "affiliateAddress" TEXT,
    "kind" TEXT NOT NULL DEFAULT 'direct',
    "txHash" TEXT NOT NULL,
    "blockNumber" BIGINT NOT NULL DEFAULT 0,
    "buyerEmail" TEXT,
    "buyerHandle" TEXT,
    "metadata" TEXT,
    "status" TEXT NOT NULL DEFAULT 'settled',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "settlements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_deliveries" (
    "id" TEXT NOT NULL,
    "merchantAddress" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "statusCode" INTEGER,
    "responseBody" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "indexer_cursor" (
    "id" TEXT NOT NULL,
    "lastBlock" BIGINT NOT NULL,
    "lastRunAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastEventCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "indexer_cursor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pay_links_slug_key" ON "pay_links"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "settlements_orderId_key" ON "settlements"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "settlements_txHash_key" ON "settlements"("txHash");

-- CreateIndex
CREATE INDEX "settlements_merchantAddress_timestamp_idx" ON "settlements"("merchantAddress", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "webhook_deliveries_merchantAddress_createdAt_idx" ON "webhook_deliveries"("merchantAddress", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "pay_links" ADD CONSTRAINT "pay_links_merchantAddress_fkey" FOREIGN KEY ("merchantAddress") REFERENCES "merchants"("address") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pay_link_plans" ADD CONSTRAINT "pay_link_plans_payLinkId_fkey" FOREIGN KEY ("payLinkId") REFERENCES "pay_links"("slug") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_merchantAddress_fkey" FOREIGN KEY ("merchantAddress") REFERENCES "merchants"("address") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_payLinkId_fkey" FOREIGN KEY ("payLinkId") REFERENCES "pay_links"("slug") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_planId_fkey" FOREIGN KEY ("planId") REFERENCES "pay_link_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_merchantAddress_fkey" FOREIGN KEY ("merchantAddress") REFERENCES "merchants"("address") ON DELETE CASCADE ON UPDATE CASCADE;

