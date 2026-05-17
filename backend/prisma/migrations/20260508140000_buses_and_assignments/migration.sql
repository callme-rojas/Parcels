-- CreateEnum
CREATE TYPE "BusEstado" AS ENUM ('CARGANDO', 'LISTO', 'EN_RUTA', 'INACTIVO');

-- CreateTable
CREATE TABLE "buses" (
    "id" UUID NOT NULL,
    "placa" TEXT NOT NULL,
    "modelo" TEXT,
    "flota" TEXT NOT NULL,
    "routeCode" TEXT NOT NULL,
    "routeLabel" TEXT NOT NULL,
    "capacidad" INTEGER NOT NULL DEFAULT 30,
    "estado" "BusEstado" NOT NULL DEFAULT 'CARGANDO',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "salidaProgramada" TEXT,
    "conductor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "buses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parcel_bus_assignments" (
    "id" UUID NOT NULL,
    "parcelId" UUID NOT NULL,
    "busId" UUID NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "loadedAt" TIMESTAMP(3),
    "unloadedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "parcel_bus_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bus_tracking_events" (
    "id" UUID NOT NULL,
    "busId" UUID NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "velocidad" DOUBLE PRECISION,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bus_tracking_events_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "parcels" ADD COLUMN "assignedBusId" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "buses_placa_key" ON "buses"("placa");

-- CreateIndex
CREATE INDEX "parcel_bus_assignments_parcelId_isActive_idx" ON "parcel_bus_assignments"("parcelId", "isActive");

-- CreateIndex
CREATE INDEX "bus_tracking_events_busId_recordedAt_idx" ON "bus_tracking_events"("busId", "recordedAt");

-- AddForeignKey
ALTER TABLE "parcels" ADD CONSTRAINT "parcels_assignedBusId_fkey" FOREIGN KEY ("assignedBusId") REFERENCES "buses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parcel_bus_assignments" ADD CONSTRAINT "parcel_bus_assignments_parcelId_fkey" FOREIGN KEY ("parcelId") REFERENCES "parcels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parcel_bus_assignments" ADD CONSTRAINT "parcel_bus_assignments_busId_fkey" FOREIGN KEY ("busId") REFERENCES "buses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bus_tracking_events" ADD CONSTRAINT "bus_tracking_events_busId_fkey" FOREIGN KEY ("busId") REFERENCES "buses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
