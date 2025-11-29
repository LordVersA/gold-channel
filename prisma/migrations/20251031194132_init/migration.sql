-- CreateTable
CREATE TABLE "Admin" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" BIGINT NOT NULL,
    "telegramUsername" TEXT,
    "channelId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Collaborator" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" BIGINT NOT NULL,
    "telegramUsername" TEXT,
    "registeredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "InviteToken" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "token" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdBy" BIGINT NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "channelId" TEXT
);

-- CreateTable
CREATE TABLE "GoldSet" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "channelMessageId" INTEGER NOT NULL,
    "weight" REAL NOT NULL,
    "caption" TEXT NOT NULL,
    "publishedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "channelId" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "PriceCheck" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" BIGINT NOT NULL,
    "goldSetId" INTEGER NOT NULL,
    "checkedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PriceCheck_goldSetId_fkey" FOREIGN KEY ("goldSetId") REFERENCES "GoldSet" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PriceCache" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pricePerGram" REAL NOT NULL,
    "fetchedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ChannelConfig" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "channelId" TEXT NOT NULL,
    "discountPercentage" REAL NOT NULL DEFAULT 10,
    "cacheTtl" INTEGER NOT NULL DEFAULT 120
);

-- CreateIndex
CREATE UNIQUE INDEX "Admin_userId_key" ON "Admin"("userId");

-- CreateIndex
CREATE INDEX "Admin_userId_idx" ON "Admin"("userId");

-- CreateIndex
CREATE INDEX "Admin_channelId_idx" ON "Admin"("channelId");

-- CreateIndex
CREATE UNIQUE INDEX "Collaborator_userId_key" ON "Collaborator"("userId");

-- CreateIndex
CREATE INDEX "Collaborator_userId_idx" ON "Collaborator"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "InviteToken_token_key" ON "InviteToken"("token");

-- CreateIndex
CREATE INDEX "InviteToken_token_idx" ON "InviteToken"("token");

-- CreateIndex
CREATE INDEX "InviteToken_used_idx" ON "InviteToken"("used");

-- CreateIndex
CREATE INDEX "GoldSet_channelId_idx" ON "GoldSet"("channelId");

-- CreateIndex
CREATE INDEX "GoldSet_channelMessageId_idx" ON "GoldSet"("channelMessageId");

-- CreateIndex
CREATE INDEX "PriceCheck_goldSetId_idx" ON "PriceCheck"("goldSetId");

-- CreateIndex
CREATE INDEX "PriceCheck_checkedAt_idx" ON "PriceCheck"("checkedAt");

-- CreateIndex
CREATE INDEX "PriceCheck_userId_idx" ON "PriceCheck"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ChannelConfig_channelId_key" ON "ChannelConfig"("channelId");

-- CreateIndex
CREATE INDEX "ChannelConfig_channelId_idx" ON "ChannelConfig"("channelId");
