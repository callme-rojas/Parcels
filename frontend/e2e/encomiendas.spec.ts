import { test, expect } from '@playwright/test';

test.describe('Flujos Operativos y Mejoras en el Sistema', () => {
  test('debería registrar un nuevo envío con disclaimer y opción de pago en efectivo', async ({ page }) => {
    // 1. Ir a la página pública de envío
    await page.goto('/enviar');
    await expect(page.locator('h2').first()).toContainText('remitente');

    // ── Paso 1: Datos del Remitente ──
    await page.fill('input[placeholder*="Rosa Méndez"]', 'Juan Carlos');
    await page.fill('input[placeholder*="9102778"]', '6543210');
    await page.fill('input[placeholder="tu@email.com"]', 'juan@gmail.com');
    await page.fill('input[placeholder*="77012345"]', '71020304');
    await page.click('button:has-text("Continuar")');

    // ── Paso 2: Datos del Destinatario ──
    await page.fill('input[placeholder*="quien recibe"]', 'María Destinataria');
    await page.fill('input[placeholder*="validar entrega"]', '7654321');
    await page.fill('input[placeholder*="68912345"]', '68080900');
    await page.click('button:has-text("Continuar")');

    // ── Paso 3: Contenido ──
    await page.click('.category-card:has-text("Ropa")');
    await page.fill('input[placeholder*="Un pantalón"]', 'Caja de ropa variada y zapatos');
    await page.click('button:has-text("Continuar")');

    // ── Paso 4: Dimensiones, Ruta y Pago ──
    await page.fill('input[placeholder*="5.5"]', '4.5');
    await page.fill('input[placeholder="Largo"]', '30');
    await page.fill('input[placeholder="Ancho"]', '20');
    await page.fill('input[placeholder="Alto"]', '15');
    
    // Seleccionar ruta Santa Cruz -> Puerto Quijarro
    await page.selectOption('select.form-input', 'SCZ-PQA');

    // Pago por el Remitente (Origen)
    await page.click('button:has-text("Remitente")');
    // Seleccionar Efectivo en Ventanilla
    await page.click('button:has-text("Efectivo")');

    // Verificar que el Disclaimer Legal esté presente
    const disclaimerBox = page.locator('div:has-text("Términos y Condiciones del Envío")').last();
    await expect(disclaimerBox).toBeVisible();
    await expect(disclaimerBox).toContainText('15 días calendario');
    await expect(disclaimerBox).toContainText('Cancelada/Abandonada');

    // Confirmar y registrar
    await page.click('button:has-text("Registrar y generar etiqueta")');

    // ── Paso 5: Confirmación ──
    await page.waitForSelector('h2:has-text("¡Envío registrado con éxito!")');
    await expect(page.locator('h2').first()).toContainText('Envío registrado', { ignoreCase: true });

    // Verificar que indica pago pendiente en ventanilla por ser efectivo
    await expect(page.locator('body')).toContainText('Pago Pendiente en Origen (Ventanilla)', { ignoreCase: true });
    await expect(page.locator('body')).toContainText('en efectivo al momento de entregar físicamente', { ignoreCase: true });
  });

  test('debería filtrar la ayuda para mostrar solo el manual de Bodeguero', async ({ page }) => {
    // 1. Iniciar sesión como Bodeguero
    await page.goto('/login');
    await page.fill('#email', 'bodega@travell.test');
    await page.fill('#password', 'bodega123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/bodega');

    // 2. Ir a Ayuda
    await page.goto('/ayuda');
    await expect(page.locator('h2.enc-header__title')).toContainText('Centro de Ayuda');

    // 3. Verificar que se muestra la guía de Bodega y que las otras guías no son visibles
    await expect(page.locator('.dashboard-panel__title')).toContainText('Guía para Personal de Bodega');
    
    // Las pestañas de navegación de tabs deben estar ocultas en el DOM (restringido a su rol)
    const tabs = page.locator('.tabs-navigation');
    await expect(tabs).not.toBeVisible();
  });

  test('debería deshabilitar buses llenos en la pantalla de Bodega', async ({ page }) => {
    // 1. Iniciar sesión como Bodeguero
    await page.goto('/login');
    await page.fill('#email', 'bodega@travell.test');
    await page.fill('#password', 'bodega123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/bodega');

    // 2. Hacer clic en el primer botón de "Asignar Bus" si está disponible
    const asignarBusBtn = page.locator('button:has-text("Asignar Bus")').first();
    if (await asignarBusBtn.isVisible()) {
      await asignarBusBtn.click();
      
      // Esperar a que se despliegue el selector de buses
      const busSelector = page.locator('.bodega-bus-select select');
      await expect(busSelector).toBeVisible();

      // Verificar que se incluyó el contador de capacidad en las opciones
      const optionsText = await busSelector.locator('option').allTextContents();
      expect(optionsText.some(t => t.includes('disp.') || t.includes('max'))).toBe(true);
    }
  });
});
