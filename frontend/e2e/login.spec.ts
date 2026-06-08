import { test, expect } from '@playwright/test';

test.describe('Autenticación y Redirección por Rol', () => {
  test('debería iniciar sesión como Administrador y redirigir al Dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', 'admin@travell.test');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');

    // Esperar redirección al Dashboard
    await page.waitForURL('**/dashboard');
    await expect(page).toHaveURL(/.*dashboard/);
    
    // Verificar que muestre información del panel
    await expect(page.locator('.topbar__title')).toContainText('Tablero');
  });

  test('debería iniciar sesión como Bodeguero y redirigir al panel de Bodega', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', 'bodega@travell.test');
    await page.fill('#password', 'bodega123');
    await page.click('button[type="submit"]');

    // Esperar redirección al panel de Bodega
    await page.waitForURL('**/bodega');
    await expect(page).toHaveURL(/.*bodega/);

    // Verificar sección del panel de Bodega
    await expect(page.locator('h1')).toContainText('Bodega');
  });

  test('debería iniciar sesión como Taquillero y redirigir al panel de Taquilla', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', 'taquilla@travell.test');
    await page.fill('#password', 'taquilla123');
    await page.click('button[type="submit"]');

    // Esperar redirección al panel de Taquilla
    await page.waitForURL('**/taquilla');
    await expect(page).toHaveURL(/.*taquilla/);

    // Verificar sección del panel de Taquilla
    await expect(page.locator('h1')).toContainText('Taquilla');
  });

  test('debería mostrar error con credenciales incorrectas', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#email', 'admin@travell.test');
    await page.fill('#password', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Verificar mensaje de error
    const errorAlert = page.locator('.login-card__error');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText('Credenciales inválidas');
  });
});
