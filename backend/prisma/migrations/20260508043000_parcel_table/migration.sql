/*
  Create parcel table + status enum for createParcel mutation.
*/

-- Create enum type
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ParcelStatus') THEN
    CREATE TYPE "ParcelStatus" AS ENUM ('PENDING','IN_TRANSIT','DELIVERED','CANCELLED');
  END IF;
END $$;

-- Create parcels table
CREATE TABLE IF NOT EXISTS "parcels" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "trackingNumber" TEXT NOT NULL,
  "senderName" TEXT NOT NULL,
  "recipientName" TEXT NOT NULL,
  "originAddress" TEXT,
  "destinationAddress" TEXT,
  "originLng" DOUBLE PRECISION,
  "originLat" DOUBLE PRECISION,
  "destinationLng" DOUBLE PRECISION,
  "destinationLat" DOUBLE PRECISION,
  "weight" DOUBLE PRECISION NOT NULL,
  "status" "ParcelStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deliveredAt" TIMESTAMP(3),
  CONSTRAINT "parcels_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "parcels_trackingNumber_key" UNIQUE ("trackingNumber")
);

