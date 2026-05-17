-- Add optional phone to usuarios (aligns with frontend User.telefono)
ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "telefono" TEXT;
