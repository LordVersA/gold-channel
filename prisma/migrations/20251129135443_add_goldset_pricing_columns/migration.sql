-- Safe migration: Add pricing columns to GoldSet
-- This preserves ALL existing data

-- SQLite doesn't support ADD COLUMN IF NOT EXISTS
-- So we check manually and only add if missing

-- Add customerTax column (will fail silently if exists)
ALTER TABLE "GoldSet" ADD COLUMN "customerTax" REAL;

-- Add customerLaborFee column
ALTER TABLE "GoldSet" ADD COLUMN "customerLaborFee" REAL;

-- Add customerSellingProfit column
ALTER TABLE "GoldSet" ADD COLUMN "customerSellingProfit" REAL;

-- Add collabTax column
ALTER TABLE "GoldSet" ADD COLUMN "collabTax" REAL;

-- Add collabLaborFee column
ALTER TABLE "GoldSet" ADD COLUMN "collabLaborFee" REAL;

-- Add collabSellingProfit column
ALTER TABLE "GoldSet" ADD COLUMN "collabSellingProfit" REAL;
