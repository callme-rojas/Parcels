/*
  Migración manual (Prisma v7) para unificar REMITENTE/DESTINATARIO -> CLIENTE.
  Postgres no permite remover valores de ENUM directamente; se recrea el tipo.
*/

-- Rename old enum type
ALTER TYPE "Rol" RENAME TO "Rol_old";

-- Create new enum type
CREATE TYPE "Rol" AS ENUM ('ADMINISTRADOR', 'TAQUILLA', 'BODEGA', 'CLIENTE');

-- Update column to use new enum, mapping legacy values to CLIENTE
ALTER TABLE "usuarios" ALTER COLUMN "rol" DROP DEFAULT;
ALTER TABLE "usuarios"
  ALTER COLUMN "rol"
  TYPE "Rol"
  USING (
    CASE
      WHEN "rol"::text IN ('REMITENTE', 'DESTINATARIO') THEN 'CLIENTE'
      ELSE "rol"::text
    END
  )::"Rol";

-- Restore default
ALTER TABLE "usuarios" ALTER COLUMN "rol" SET DEFAULT 'CLIENTE';

-- Drop old enum type
DROP TYPE "Rol_old";

