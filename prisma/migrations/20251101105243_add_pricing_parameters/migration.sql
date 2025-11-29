-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ChannelConfig" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "channelId" TEXT NOT NULL,
    "discountPercentage" REAL NOT NULL DEFAULT 10,
    "cacheTtl" INTEGER NOT NULL DEFAULT 120,
    "customerTax" REAL NOT NULL DEFAULT 0.0,
    "customerLaborFee" REAL NOT NULL DEFAULT 0.19,
    "customerSellingProfit" REAL NOT NULL DEFAULT 0.07,
    "collabTax" REAL NOT NULL DEFAULT 0.0,
    "collabLaborFee" REAL NOT NULL DEFAULT 0.09,
    "collabSellingProfit" REAL NOT NULL DEFAULT 0.0
);
INSERT INTO "new_ChannelConfig" ("cacheTtl", "channelId", "discountPercentage", "id") SELECT "cacheTtl", "channelId", "discountPercentage", "id" FROM "ChannelConfig";
DROP TABLE "ChannelConfig";
ALTER TABLE "new_ChannelConfig" RENAME TO "ChannelConfig";
CREATE UNIQUE INDEX "ChannelConfig_channelId_key" ON "ChannelConfig"("channelId");
CREATE INDEX "ChannelConfig_channelId_idx" ON "ChannelConfig"("channelId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
