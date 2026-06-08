import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('GraphQL API (e2e)', () => {
  let app: INestApplication<App>;
  let adminToken: string;
  let bodegaToken: string;
  let taquillaToken: string;
  let createdParcelId: string;
  let testBusId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // ─── 1. PRUEBAS DE AUTENTICACIÓN ────────────────────────────
  describe('Auth Mutation: login', () => {
    it('debería iniciar sesión correctamente como Administrador', async () => {
      const query = `
        mutation Login($email: String!, $password: String!) {
          login(input: { email: $email, password: $password }) {
            accessToken
            user {
              nombre
              rol
            }
          }
        }
      `;

      const res = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query,
          variables: {
            email: 'admin@travell.test',
            password: 'admin123',
          },
        })
        .expect(200);

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.login.accessToken).toBeDefined();
      expect(res.body.data.login.user.rol).toBe('ADMINISTRADOR');
      adminToken = res.body.data.login.accessToken;
    });

    it('debería iniciar sesión correctamente como Bodeguero', async () => {
      const query = `
        mutation Login($email: String!, $password: String!) {
          login(input: { email: $email, password: $password }) {
            accessToken
            user {
              rol
            }
          }
        }
      `;

      const res = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query,
          variables: {
            email: 'bodega@travell.test',
            password: 'bodega123',
          },
        })
        .expect(200);

      expect(res.body.errors).toBeUndefined();
      bodegaToken = res.body.data.login.accessToken;
    });

    it('debería iniciar sesión correctamente como Taquillero', async () => {
      const query = `
        mutation Login($email: String!, $password: String!) {
          login(input: { email: $email, password: $password }) {
            accessToken
            user {
              rol
            }
          }
        }
      `;

      const res = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query,
          variables: {
            email: 'taquilla@travell.test',
            password: 'taquilla123',
          },
        })
        .expect(200);

      expect(res.body.errors).toBeUndefined();
      taquillaToken = res.body.data.login.accessToken;
    });

    it('debería rechazar credenciales inválidas', async () => {
      const query = `
        mutation Login($email: String!, $password: String!) {
          login(input: { email: $email, password: $password }) {
            accessToken
          }
        }
      `;

      const res = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query,
          variables: {
            email: 'admin@travell.test',
            password: 'password_incorrecto',
          },
        })
        .expect(200);

      expect(res.body.errors).toBeDefined();
      expect(res.body.errors[0].message).toContain('Credenciales inválidas');
    });
  });

  // ─── 2. PRUEBAS DE CREACIÓN DE ENCOMIENDAS ──────────────────
  describe('Parcel Mutation: createParcel', () => {
    it('debería crear una encomienda con método de pago EFECTIVO', async () => {
      const query = `
        mutation CreateParcel($input: CreateParcelInput!) {
          createParcel(input: $input) {
            id
            trackingNumber
            senderName
            metodoPago
            estadoPago
            costoEnvio
          }
        }
      `;

      const input = {
        senderName: 'Test Remitente',
        senderCi: '1234567',
        senderPhone: '+591 70000000',
        senderEmail: 'test_remitente@gmail.com',
        recipientName: 'Test Destinatario',
        recipientCi: '7654321',
        recipientPhone: '+591 71111111',
        content: 'Caja de herramientas de prueba',
        weight: 5.5,
        routeCode: 'SCZ-PQA',
        tipoPago: 'REMITENTE',
        metodoPago: 'EFECTIVO',
      };

      const res = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query, variables: { input } })
        .expect(200);

      expect(res.body.errors).toBeUndefined();
      const parcel = res.body.data.createParcel;
      expect(parcel.id).toBeDefined();
      expect(parcel.metodoPago).toBe('EFECTIVO');
      expect(parcel.estadoPago).toBe('PENDIENTE');
      createdParcelId = parcel.id;
    });
  });

  // ─── 3. PRUEBAS DE FLUX DE BODEGA ──────────────────────────
  describe('Bodega Mutations E2E Flow', () => {
    it('debería listar buses para obtener un ID válido de bus', async () => {
      const query = `
        query GetBuses {
          buses {
            id
            placa
            routeCode
          }
        }
      `;

      const res = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query })
        .expect(200);

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.buses.length).toBeGreaterThan(0);
      const matchingBus = res.body.data.buses.find((b: any) => b.routeCode === 'SCZ-PQA');
      expect(matchingBus).toBeDefined();
      testBusId = matchingBus.id;
    });

    it('debería recepcionar la encomienda (cambiar estado a RECEPCIONADO)', async () => {
      const query = `
        mutation UpdateStatus($input: UpdateParcelStatusInput!) {
          updateParcelStatus(input: $input) {
            id
            status
          }
        }
      `;

      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${bodegaToken}`)
        .send({
          query,
          variables: {
            input: {
              id: createdParcelId,
              status: 'RECEPCIONADO',
              note: 'Paquete recibido en bodega de origen',
            },
          },
        });

      console.log('UpdateStatus response:', JSON.stringify(res.body, null, 2));

      expect(res.status).toBe(200);
      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.updateParcelStatus.status).toBe('RECEPCIONADO');
    });

    it('debería clasificar la encomienda en bodega como RECEPCIONADO', async () => {
      const query = `
        mutation Clasificar($input: ParcelActionInput!) {
          clasificarEncomienda(input: $input) {
            id
            status
          }
        }
      `;

      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${bodegaToken}`)
        .send({
          query,
          variables: {
            input: {
              parcelId: createdParcelId,
              note: 'Clasificado en bodega norte',
            },
          },
        })
        .expect(200);

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.clasificarEncomienda.status).toBe('RECEPCIONADO');
    });

    it('debería asignar la encomienda clasificada al bus', async () => {
      const query = `
        mutation AsignarBus($input: AsignarEncomiendaBusInput!) {
          asignarEncomiendaABus(input: $input) {
            id
            assignedBusId
          }
        }
      `;

      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${bodegaToken}`)
        .send({
          query,
          variables: {
            input: {
              parcelId: createdParcelId,
              busId: testBusId,
              note: 'Asignado a bus Mercedes',
            },
          },
        });

      console.log('AsignarBus response:', JSON.stringify(res.body, null, 2));

      expect(res.status).toBe(200);
      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.asignarEncomiendaABus.assignedBusId).toBe(testBusId);
    });

    it('debería registrar la carga de la encomienda en el bus (EN_TRANSITO)', async () => {
      const query = `
        mutation RegistrarCarga($input: ParcelActionInput!) {
          registrarCarga(input: $input) {
            id
            status
          }
        }
      `;

      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${bodegaToken}`)
        .send({
          query,
          variables: {
            input: {
              parcelId: createdParcelId,
              note: 'Paquete físicamente a bordo del bus',
            },
          },
        })
        .expect(200);

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.registrarCarga.status).toBe('EN_TRANSITO');
    });

    it('debería registrar la descarga en destino de la encomienda (EN_DESTINO)', async () => {
      const query = `
        mutation RegistrarDescarga($input: ParcelActionInput!) {
          registrarDescarga(input: $input) {
            id
            status
          }
        }
      `;

      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${bodegaToken}`)
        .send({
          query,
          variables: {
            input: {
              parcelId: createdParcelId,
              note: 'Descargado en oficina de destino',
            },
          },
        })
        .expect(200);

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.registrarDescarga.status).toBe('EN_DESTINO');
    });

    it('debería marcar la encomienda como disponible para retiro (DISPONIBLE)', async () => {
      const query = `
        mutation MarcarDisponible($input: ParcelActionInput!) {
          marcarDisponible(input: $input) {
            id
            status
          }
        }
      `;

      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${bodegaToken}`)
        .send({
          query,
          variables: {
            input: {
              parcelId: createdParcelId,
              note: 'Listo en estantería central para entrega',
            },
          },
        })
        .expect(200);

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.marcarDisponible.status).toBe('DISPONIBLE');
    });
  });

  // ─── 4. PRUEBAS DE FLUX DE TAQUILLA (ENTREGA) ──────────────
  describe('Taquilla Mutation: confirmarRetiro', () => {
    it('debería rechazar retiro si la CI presentada no coincide', async () => {
      const query = `
        mutation ConfirmarRetiro($input: ConfirmarRetiroInput!) {
          confirmarRetiro(input: $input) {
            id
            status
            estadoPago
          }
        }
      `;

      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${taquillaToken}`)
        .send({
          query,
          variables: {
            input: {
              parcelId: createdParcelId,
              recipientCi: 'CI_ERRONEA_123',
            },
          },
        })
        .expect(200);

      expect(res.body.errors).toBeDefined();
      expect(res.body.errors[0].message).toContain('El CI ingresado no coincide');
    });

    it('debería realizar el cobro en efectivo y entregar el paquete exitosamente', async () => {
      // Primero registramos el pago
      const registrarPagoQuery = `
        mutation RegistrarPago($id: ID!, $metodoPago: String) {
          registrarPago(id: $id, metodoPago: $metodoPago) {
            id
            estadoPago
            metodoPago
          }
        }
      `;

      const pagoRes = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: registrarPagoQuery,
          variables: {
            id: createdParcelId,
            metodoPago: 'EFECTIVO',
          },
        })
        .expect(200);

      expect(pagoRes.body.errors).toBeUndefined();
      expect(pagoRes.body.data.registrarPago.estadoPago).toBe('PAGADO');
      expect(pagoRes.body.data.registrarPago.metodoPago).toBe('EFECTIVO');

      // Ahora confirmamos retiro con CI correcta ('7654321')
      const query = `
        mutation ConfirmarRetiro($input: ConfirmarRetiroInput!) {
          confirmarRetiro(input: $input) {
            id
            status
          }
        }
      `;

      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${taquillaToken}`)
        .send({
          query,
          variables: {
            input: {
              parcelId: createdParcelId,
              recipientCi: '7654321',
            },
          },
        })
        .expect(200);

      expect(res.body.errors).toBeUndefined();
      expect(res.body.data.confirmarRetiro.status).toBe('ENTREGADO');
    });
  });

  // ─── 5. PRUEBAS DE INDICADORES FINANCIEROS ─────────────────
  describe('Reports Query: indicadoresOperativos', () => {
    it('debería retornar el resumen financiero incluyendo ventas de etiquetas y montos totales', async () => {
      const query = `
        query GetIndicadores {
          indicadoresOperativos {
            fechaDesde
            fechaHasta
            totalRegistradas
            totalEntregadas
            totalVentaEtiquetas
            montoTotalRegistrado
            montoTotalPagado
            montoTotalPendiente
          }
        }
      `;

      const res = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ query })
        .expect(200);

      expect(res.body.errors).toBeUndefined();
      const kpis = res.body.data.indicadoresOperativos;
      expect(kpis.totalRegistradas).toBeGreaterThan(0);
      expect(kpis.totalVentaEtiquetas).toBeDefined();
      expect(kpis.montoTotalRegistrado).toBeDefined();
      expect(kpis.montoTotalPagado).toBeDefined();
      expect(kpis.montoTotalPendiente).toBeDefined();
      
      // Validar tipos
      expect(typeof kpis.totalVentaEtiquetas).toBe('number');
      expect(typeof kpis.montoTotalRegistrado).toBe('number');
      expect(typeof kpis.montoTotalPagado).toBe('number');
      expect(typeof kpis.montoTotalPendiente).toBe('number');
    });
  });
});
