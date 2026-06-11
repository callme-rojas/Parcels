import { test, expect } from '@playwright/test';

// ═══════════════════════════════════════════════════════════════
// GRUPO 1: AUTENTICACIÓN Y CONTROL DE ACCESO POR ROLES
// ═══════════════════════════════════════════════════════════════
test.describe('1. Autenticación y Control de Acceso por Roles', () => {
  test('CP-01: Iniciar sesión como Administrador → redirige al Dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', 'admin@travell.test');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/dashboard');
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('.topbar__title')).toContainText('Tablero');
  });

  test('CP-02: Iniciar sesión como Bodeguero → redirige al panel de Bodega', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', 'bodega@travell.test');
    await page.fill('#password', 'bodega123');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/bodega');
    await expect(page).toHaveURL(/.*bodega/);
  });

  test('CP-03: Iniciar sesión como Taquillero → redirige al panel de Taquilla', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', 'taquilla@travell.test');
    await page.fill('#password', 'taquilla123');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/taquilla');
    await expect(page).toHaveURL(/.*taquilla/);
  });

  test('CP-04: Credenciales incorrectas → muestra mensaje de error', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', 'admin@travell.test');
    await page.fill('#password', 'clave_incorrecta');
    await page.click('button[type="submit"]');

    const errorAlert = page.locator('.login-card__error');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText('Credenciales inválidas');
  });
});

// ═══════════════════════════════════════════════════════════════
// GRUPO 2: REGISTRO DE ENCOMIENDA Y GENERACIÓN DE ETIQUETA
// ═══════════════════════════════════════════════════════════════
test.describe('2. Registro de Encomienda y Generación de Etiqueta', () => {
  test('CP-05: Registrar nuevo envío completo con disclaimer y pago en efectivo', async ({ page }) => {
    await page.goto('/enviar');
    await expect(page.locator('h2').first()).toContainText('remitente', { ignoreCase: true });

    // ── Paso 1: Datos del Remitente ──
    await page.fill('input[placeholder*="Rosa Méndez"]', 'Pedro Gutiérrez');
    await page.fill('input[placeholder*="9102778"]', '5544332');
    await page.fill('input[placeholder="tu@email.com"]', 'pedro@gmail.com');
    await page.fill('input[placeholder*="77012345"]', '72233445');
    await page.click('button:has-text("Continuar")');

    // ── Paso 2: Datos del Destinatario ──
    await page.fill('input[placeholder*="quien recibe"]', 'Lucía Rojas');
    await page.fill('input[placeholder*="validar entrega"]', '9988776');
    await page.fill('input[placeholder*="68912345"]', '69112233');
    await page.click('button:has-text("Continuar")');

    // ── Paso 3: Contenido ──
    await page.click('.category-card:has-text("Ropa")');
    await page.fill('input[placeholder*="Un pantalón"]', 'Caja de ropa variada');
    await page.click('button:has-text("Continuar")');

    // ── Paso 4: Dimensiones, Ruta y Pago ──
    await page.fill('input[placeholder*="5.5"]', '3.0');
    await page.fill('input[placeholder="Largo"]', '25');
    await page.fill('input[placeholder="Ancho"]', '15');
    await page.fill('input[placeholder="Alto"]', '10');

    await page.selectOption('select.form-input', 'SCZ-PQA');
    await page.click('button:has-text("Remitente")');
    await page.click('button:has-text("Efectivo")');

    // Verificar Disclaimer Legal
    const disclaimerBox = page.locator('div:has-text("Términos y Condiciones del Envío")').last();
    await expect(disclaimerBox).toBeVisible();
    await expect(disclaimerBox).toContainText('15 días calendario');

    // Verificar que el costo fue calculado
    const costEstimator = page.locator('.cost-estimator__price');
    await expect(costEstimator).toBeVisible();
    await expect(costEstimator).toContainText('BOB');

    await page.click('button:has-text("Registrar y generar etiqueta")');

    // ── Paso 5: Confirmación ──
    await page.waitForSelector('.envio-success', { timeout: 15000 });
    await expect(page.locator('.envio-card__title').first()).toContainText('Envío registrado', { ignoreCase: true });

    // Verificar que se generó el código de rastreo
    const trackingDisplay = page.locator('.envio-label__code');
    await expect(trackingDisplay).toBeVisible();
    await expect(trackingDisplay).toContainText('EX-');

    // Verificar que la etiqueta se muestra con el código de barras
    await expect(page.locator('.envio-label')).toBeVisible();
    await expect(page.locator('.envio-label__header')).toContainText('Travell');

    // Verificar pago pendiente en ventanilla
    await expect(page.locator('body')).toContainText('Pago Pendiente', { ignoreCase: true });

    // Verificar botones de acción
    await expect(page.locator('button:has-text("Imprimir etiqueta")')).toBeVisible();
    await expect(page.locator('a:has-text("Rastrear envío"), button:has-text("Rastrear envío")')).toBeVisible();
  });
});

// ═══════════════════════════════════════════════════════════════
// GRUPO 3: CONSULTA DE ESTADO Y RASTREO PÚBLICO
// ═══════════════════════════════════════════════════════════════
test.describe('3. Consulta de Estado y Rastreo Público', () => {
  test('CP-06: Rastrear una encomienda existente y ver resultados', async ({ page }) => {
    // Primero creamos una encomienda para obtener un código válido
    await page.goto('/enviar');
    await page.fill('input[placeholder*="Rosa Méndez"]', 'Prueba Rastreo');
    await page.fill('input[placeholder*="9102778"]', '1111111');
    await page.fill('input[placeholder="tu@email.com"]', 'test@test.com');
    await page.fill('input[placeholder*="77012345"]', '70000001');
    await page.click('button:has-text("Continuar")');
    await page.fill('input[placeholder*="quien recibe"]', 'Destino Rastreo');
    await page.fill('input[placeholder*="validar entrega"]', '2222222');
    await page.fill('input[placeholder*="68912345"]', '69000002');
    await page.click('button:has-text("Continuar")');
    await page.click('.category-card:has-text("Documentos")');
    await page.click('button:has-text("Continuar")');
    await page.fill('input[placeholder*="5.5"]', '1.0');
    await page.selectOption('select.form-input', 'SCZ-PQA');
    await page.click('button:has-text("Remitente")');
    await page.click('button:has-text("Efectivo")');
    await page.click('button:has-text("Registrar y generar etiqueta")');
    await page.waitForSelector('.envio-success', { timeout: 15000 });

    // Capturar el código de rastreo generado
    const trackingCode = await page.locator('.envio-label__code').textContent();
    expect(trackingCode).toBeTruthy();

    // Navegar a la página de rastreo
    await page.goto('/rastreo');
    await expect(page.locator('.rastreo-search__input')).toBeVisible();

    // Buscar con el código
    await page.fill('.rastreo-search__input', trackingCode!.trim());
    await page.click('button[type="submit"]');

    // Verificar resultados
    await page.waitForSelector('.rastreo-result', { timeout: 10000 });
    await expect(page.locator('.rastreo-result__code')).toContainText('EX-');
    await expect(page.locator('.badge')).toBeVisible();

    // Verificar campos del resultado
    await expect(page.locator('.rastreo-result__label:has-text("Remitente")')).toBeVisible();
    await expect(page.locator('.rastreo-result__label:has-text("Destinatario")')).toBeVisible();

    // Verificar que existe la línea de tiempo de eventos
    await expect(page.locator('.rastreo-timeline-section')).toBeVisible();
  });

  test('CP-07: Rastreo con código inexistente muestra mensaje de error', async ({ page }) => {
    await page.goto('/rastreo');
    await page.fill('.rastreo-search__input', 'EX-0000-ZZZ-0000000');
    await page.click('button[type="submit"]');

    // Esperar el mensaje de error
    await expect(page.locator('text=No se encontró')).toBeVisible({ timeout: 10000 });
  });
});

// ═══════════════════════════════════════════════════════════════
// GRUPO 4: PANEL ADMINISTRATIVO Y REPORTES
// ═══════════════════════════════════════════════════════════════
test.describe('4. Panel Administrativo y Reportes', () => {
  test('CP-08: Dashboard del Administrador muestra KPIs operativos', async ({ page }) => {
    // Login como Admin
    await page.goto('/login');
    await page.fill('#email', 'admin@travell.test');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    // Verificar KPIs
    await expect(page.locator('.kpi-card').first()).toBeVisible();
    await expect(page.locator('.kpi-card__label:has-text("Registradas Hoy")')).toBeVisible();
    await expect(page.locator('.kpi-card__label:has-text("En Tránsito")')).toBeVisible();
    await expect(page.locator('.kpi-card__label:has-text("Entregadas Hoy")')).toBeVisible();
    await expect(page.locator('.kpi-card__label:has-text("Disponibles")')).toBeVisible();

    // Verificar paneles de datos
    await expect(page.locator('.dashboard-panel__title:has-text("Últimas Encomiendas")')).toBeVisible();
    await expect(page.locator('.dashboard-panel__title:has-text("Rutas")')).toBeVisible();
  });

  test('CP-09: Página de Reportes muestra indicadores financieros', async ({ page }) => {
    // Login como Admin
    await page.goto('/login');
    await page.fill('#email', 'admin@travell.test');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');

    // Navegar a reportes
    await page.goto('/reportes');

    // Verificar tarjetas de indicadores
    await expect(page.locator('.detalle-card__title:has-text("Rendimiento")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.detalle-card__title:has-text("Volumen Operativo")')).toBeVisible();
    await expect(page.locator('.detalle-card__title:has-text("Resumen Financiero")')).toBeVisible();

    // Verificar campos financieros
    await expect(page.locator('text=Tasa de Éxito')).toBeVisible();
    await expect(page.locator('text=Total Registradas')).toBeVisible();
    await expect(page.locator('text=Total Recaudado')).toBeVisible();

    // Verificar tabla de historial con filtros
    await expect(page.locator('input[placeholder="Buscar por CI, Nombre, Guía..."]')).toBeVisible();
    await expect(page.locator('.data-table')).toBeVisible();
  });
});

// ═══════════════════════════════════════════════════════════════
// GRUPO 5: VALIDACIONES DE FUNCIONALIDADES ESPECÍFICAS
// ═══════════════════════════════════════════════════════════════
test.describe('5. Validaciones de Funcionalidades Específicas', () => {
  test('CP-10: Centro de Ayuda filtra contenido según rol del usuario', async ({ page }) => {
    // Login como Bodeguero
    await page.goto('/login');
    await page.fill('#email', 'bodega@travell.test');
    await page.fill('#password', 'bodega123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/bodega');

    // Navegar a Ayuda
    await page.goto('/ayuda');
    await expect(page.locator('h2.enc-header__title')).toContainText('Centro de Ayuda');

    // Verificar que solo muestra guía de Bodega
    await expect(page.locator('.dashboard-panel__title')).toContainText('Guía para Personal de Bodega');

    // Las pestañas de otros roles no deben ser visibles
    const tabs = page.locator('.tabs-navigation');
    await expect(tabs).not.toBeVisible();
  });
});
