import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const SALT = 10;

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('Missing DATABASE_URL env var');

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  console.log('🧹 Limpiando base de datos...');
  await prisma.parcelEvent.deleteMany({});
  await prisma.parcelBusAssignment.deleteMany({});
  await prisma.busTrackingEvent.deleteMany({});
  await prisma.parcel.deleteMany({});
  await prisma.bus.deleteMany({});
  await prisma.sucursal.deleteMany({});
  await prisma.usuario.deleteMany({});

  console.log('🌱 Seeding database...');

  // ─── 1. Usuarios del sistema ────────────────────────────
  const userDefs = [
    { nombre: 'Administrador', email: 'admin@encomiendas.com', password: 'admin123', rol: 'ADMINISTRADOR' as const, telefono: '+591 70000001' },
  ];

  const createdUsers: Record<string, string> = {};

  for (const u of userDefs) {
    const passwordHash = await bcrypt.hash(u.password, SALT);
    const user = await prisma.usuario.upsert({
      where: { email: u.email },
      update: { nombre: u.nombre, telefono: u.telefono, passwordHash, rol: u.rol, activo: true },
      create: { nombre: u.nombre, email: u.email, telefono: u.telefono, passwordHash, rol: u.rol, activo: true },
    });
    createdUsers[u.rol] = user.id;
    console.log(`  HN Usuario ${u.rol}: ${u.email}`);
  }

  console.log('\n✅ Seed completado exitosamente (solo Admin creado).\n');
  console.log('👥 Credenciales de acceso:');
  console.log('   admin@encomiendas.com     / admin123');

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
