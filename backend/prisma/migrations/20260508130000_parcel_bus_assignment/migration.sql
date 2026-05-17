-- MVP bus assignment on parcels (Phase 2 Bodega)
ALTER TABLE "parcels" ADD COLUMN IF NOT EXISTS "assignedBusPlaca" TEXT;
ALTER TABLE "parcels" ADD COLUMN IF NOT EXISTS "assignedBusFlota" TEXT;
