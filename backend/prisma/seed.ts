import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('Missing DATABASE_URL env var');

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  const saltRounds = 10;

  const users = [
    {
      nombre: 'Administrador',
      email: 'admin@travell.test',
      password: 'admin123',
      rol: 'ADMINISTRADOR' as const,
    },
    {
      nombre: 'Taquilla',
      email: 'taquilla@travell.test',
      password: 'taquilla123',
      rol: 'TAQUILLA' as const,
    },
    {
      nombre: 'Bodega',
      email: 'bodega@travell.test',
      password: 'bodega123',
      rol: 'BODEGA' as const,
    },
    {
      nombre: 'Cliente Demo',
      email: 'cliente@travell.test',
      password: 'cliente123',
      rol: 'CLIENTE' as const,
    },
  ];

  for (const u of users) {
    const passwordHash = await bcrypt.hash(u.password, saltRounds);
    await prisma.usuario.upsert({
      where: { email: u.email },
      update: {
        nombre: u.nombre,
        passwordHash,
        rol: u.rol,
        activo: true,
      },
      create: {
        nombre: u.nombre,
        email: u.email,
        passwordHash,
        rol: u.rol,
        activo: true,
      },
    });
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});

