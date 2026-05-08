/*
  Parcel columns required to match GraphQL schema (origin/destination not nullable).
*/

ALTER TABLE "parcels"
  ALTER COLUMN "originAddress" SET NOT NULL;

ALTER TABLE "parcels"
  ALTER COLUMN "destinationAddress" SET NOT NULL;

ALTER TABLE "parcels"
  ALTER COLUMN "originLng" SET NOT NULL;

ALTER TABLE "parcels"
  ALTER COLUMN "originLat" SET NOT NULL;

ALTER TABLE "parcels"
  ALTER COLUMN "destinationLng" SET NOT NULL;

ALTER TABLE "parcels"
  ALTER COLUMN "destinationLat" SET NOT NULL;

