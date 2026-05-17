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

  console.log('🌱 Seeding database...');

  // ─── 1. Usuarios del sistema ────────────────────────────
  const userDefs = [
    { nombre: 'Administrador',  email: 'admin@travell.test',    password: 'admin123',    rol: 'ADMINISTRADOR' as const },
    { nombre: 'Carla Gutiérrez', email: 'taquilla@travell.test', password: 'taquilla123', rol: 'TAQUILLA'      as const },
    { nombre: 'Marcos Suárez',  email: 'bodega@travell.test',   password: 'bodega123',   rol: 'BODEGA'        as const },
    { nombre: 'Rosa Méndez',    email: 'cliente@travell.test',  password: 'cliente123',  rol: 'CLIENTE'       as const },
  ];

  const createdUsers: Record<string, string> = {};

  for (const u of userDefs) {
    const passwordHash = await bcrypt.hash(u.password, SALT);
    const user = await prisma.usuario.upsert({
      where: { email: u.email },
      update: { nombre: u.nombre, passwordHash, rol: u.rol, activo: true },
      create: { nombre: u.nombre, email: u.email, passwordHash, rol: u.rol, activo: true },
    });
    createdUsers[u.rol] = user.id;
    console.log(`  ✅ Usuario ${u.rol}: ${u.email}`);
  }

  // ─── 2. Encomiendas de prueba ────────────────────────────
  // Representan distintos estados del flujo operativo
  const parcelDefs = [
    {
      trackingNumber: 'EX-2026-SCZ-0048217',
      senderName: 'Rosa Méndez Suárez',
      senderCi: '9102778SC',
      senderPhone: '+591 77123456',
      senderEmail: 'cliente@travell.test',
      recipientName: 'Juan Carlos Rojas Vargas',
      recipientCi: '7345678SC',
      recipientPhone: '+591 71234567',
      recipientEmail: 'jrojas@email.com',
      content: 'Repuestos automotrices',
      weight: 3.3,
      observations: 'Frágil – no apilar',
      routeCode: 'SCZ-PQA',
      originAddress: 'Santa Cruz de la Sierra, Bolivia',
      destinationAddress: 'Puerto Quijarro, Bolivia',
      originLat: -17.786, originLng: -63.181,
      destinationLat: -18.953, destinationLng: -57.771,
      status: 'EN_TRANSITO' as const,
    },
    {
      trackingNumber: 'EX-2026-SCZ-0048218',
      senderName: 'Carlos Gutiérrez Peña',
      senderCi: '5678901SC',
      senderPhone: '+591 72345678',
      senderEmail: 'cgutierre@mail.com',
      recipientName: 'María López Prado',
      recipientCi: '4321098SC',
      recipientPhone: '+591 73456789',
      content: 'Documentos legales',
      weight: 1.2,
      routeCode: 'SCZ-PQA',
      originAddress: 'Santa Cruz de la Sierra, Bolivia',
      destinationAddress: 'Puerto Quijarro, Bolivia',
      originLat: -17.786, originLng: -63.181,
      destinationLat: -18.953, destinationLng: -57.771,
      status: 'RECEPCIONADO' as const,
    },
    {
      trackingNumber: 'EX-2026-SCZ-0048219',
      senderName: 'Ana Vargas Montaño',
      senderCi: '8901234SC',
      senderPhone: '+591 74567890',
      senderEmail: 'avargas@mail.com',
      recipientName: 'Pedro Suárez Flores',
      recipientCi: '6789012SC',
      recipientPhone: '+591 75678901',
      content: 'Ropa y textiles',
      weight: 5.7,
      routeCode: 'SCZ-SJC',
      originAddress: 'Santa Cruz de la Sierra, Bolivia',
      destinationAddress: 'San José de Chiquitos, Bolivia',
      originLat: -17.786, originLng: -63.181,
      destinationLat: -16.973, destinationLng: -60.265,
      status: 'REGISTRADO' as const,
    },
    {
      trackingNumber: 'EX-2026-PQA-0012340',
      senderName: 'Jorge Mamani Quispe',
      senderCi: '2345678SC',
      senderPhone: '+591 76789012',
      senderEmail: 'jmamani@mail.com',
      recipientName: 'Luisa Fernández Rocha',
      recipientCi: '3456789SC',
      recipientPhone: '+591 77890123',
      content: 'Artesanías y souvenirs',
      weight: 2.1,
      routeCode: 'PQA-SCZ',
      originAddress: 'Puerto Quijarro, Bolivia',
      destinationAddress: 'Santa Cruz de la Sierra, Bolivia',
      originLat: -18.953, originLng: -57.771,
      destinationLat: -17.786, destinationLng: -63.181,
      status: 'DISPONIBLE' as const,
    },
    {
      trackingNumber: 'EX-2026-SCZ-0048220',
      senderName: 'Patricia Rojas Chávez',
      senderCi: '1234567SC',
      senderPhone: '+591 78901234',
      senderEmail: 'projas@mail.com',
      recipientName: 'Miguel Ángel Torres',
      recipientCi: '9012345SC',
      recipientPhone: '+591 79012345',
      content: 'Herramientas industriales',
      weight: 8.4,
      observations: 'Muy pesado – cuidado',
      routeCode: 'SCZ-ROB',
      originAddress: 'Santa Cruz de la Sierra, Bolivia',
      destinationAddress: 'Roboré, Bolivia',
      originLat: -17.786, originLng: -63.181,
      destinationLat: -18.689, destinationLng: -57.643,
      status: 'ENTREGADO' as const,
      deliveredAt: new Date('2026-05-14T15:30:00Z'),
    },
    {
      trackingNumber: 'EX-2026-SCZ-0048221',
      senderName: 'Fernando Díaz Robles',
      senderCi: '6543210SC',
      senderPhone: '+591 70123456',
      senderEmail: 'fdiaz@mail.com',
      recipientName: 'Sofía Castillo Vda.',
      recipientCi: '5432109SC',
      recipientPhone: '+591 71098765',
      content: 'Medicamentos e insumos médicos',
      weight: 4.0,
      observations: 'Mantener fresco',
      routeCode: 'SCZ-PQA',
      originAddress: 'Santa Cruz de la Sierra, Bolivia',
      destinationAddress: 'Puerto Quijarro, Bolivia',
      originLat: -17.786, originLng: -63.181,
      destinationLat: -18.953, destinationLng: -57.771,
      status: 'EN_DESTINO' as const,
    },
  ];

  for (const p of parcelDefs) {
    // Determinar el estado inicial del primer evento
    const firstStatus = 'REGISTRADO' as const;

    await prisma.parcel.upsert({
      where: { trackingNumber: p.trackingNumber },
      update: { status: p.status },
      create: {
        ...p,
        events: {
          create: {
            status: firstStatus,
            note: 'Encomienda registrada en el sistema (seed)',
            usuarioId: createdUsers['ADMINISTRADOR'],
          },
        },
      },
    });
    console.log(`  📦 Encomienda ${p.trackingNumber} → ${p.status}`);
  }

  console.log('\n✅ Seed completado exitosamente.\n');
  console.log('👥 Credenciales de acceso:');
  console.log('   admin@travell.test     / admin123');
  console.log('   taquilla@travell.test  / taquilla123');
  console.log('   bodega@travell.test    / bodega123');
  console.log('   cliente@travell.test   / cliente123');

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
