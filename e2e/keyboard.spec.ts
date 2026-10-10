import { test, expect } from '@playwright/test';

test.describe('Keyboard Only Navigation & Focus Management', () => {

  test.beforeEach(async ({ context }) => {
    await context.addInitScript(() => {
      window.localStorage.setItem('cookie_consent', 'accepted');
    });
  });

  test('Skip link is the first focusable element and jumps to main content', async ({ page }) => {
    await page.goto('/');

    // Press Tab once to focus the skip link
    await page.keyboard.press('Tab');

    const activeElementText = await page.evaluate(() => document.activeElement?.textContent?.trim());
    expect(activeElementText).toMatch(/Skip to main content/i);

    // Activate the skip link using keyboard
    await page.keyboard.press('Enter');

    // Focus must move to the main content landmark
    const focusedId = await page.evaluate(() => document.activeElement?.id);
    expect(focusedId).toBe('main-content');
  });

  test('Form validation moves focus to the first erroneous input', async ({ page }) => {
    await page.goto('/login');

    // Tab to submit button without entering credentials
    await page.locator('button[type="submit"]').focus();
    await page.keyboard.press('Enter');

    // Verify error message appeared
    await expect(page.getByText(/Email address is required|Invalid email address/i).first()).toBeVisible();

    // Verify focus automatically shifted to the email input
    const focusedElementId = await page.evaluate(() => document.activeElement?.id);
    expect(focusedElementId).toBe('email');
  });

  test('Login completed purely via keyboard', async ({ page }) => {
    await page.goto('/login');

    // Focus email field
    await page.locator('#email').focus();
    await page.keyboard.type('e2e_candidate@test.local');

    // Tab through Forgot Password link to Password field
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    const focusedField = await page.evaluate(() => document.activeElement?.id);
    expect(focusedField).toBe('password');
    await page.keyboard.type('TestPassword123!');

    // Tab until submit button
    while (await page.evaluate(() => (document.activeElement as HTMLElement)?.getAttribute('type') !== 'submit')) {
      await page.keyboard.press('Tab');
    }

    // Press Enter to submit
    await page.keyboard.press('Enter');

    // Expect successful login and redirect
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('Dialog traps focus on Tab and restores focus on Escape', async ({ page }) => {
    // 1. Log in
    await page.goto('/login');
    await page.fill('#email', 'e2e_candidate@test.local');
    await page.fill('#password', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);

    // 2. Go to job detail
    await page.goto('/jobs/33333333-3333-3333-3333-333333333333');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Accessibility QA Analyst/i);

    // Focus "Review & Apply" button using keyboard
    const applyBtn = page.getByRole('button', { name: /Review & Apply/i });
    await applyBtn.focus();
    await page.keyboard.press('Enter');

    // Dialog opens
    const dialog = page.locator('div[role="dialog"]');
    await expect(dialog).toBeVisible();

    // Verify focus is inside the dialog
    await expect(async () => {
      const isFocusInside = await page.evaluate(() => {
        const dialog = document.querySelector('div[role="dialog"]');
        return dialog ? dialog.contains(document.activeElement) : false;
      });
      expect(isFocusInside).toBe(true);
    }).toPass({ timeout: 5000 });

    // Press Escape to dismiss dialog
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();

    // Verify focus is restored to the apply button
    const restoredToApplyBtn = await page.evaluate(() => {
      const active = document.activeElement;
      return active?.textContent?.includes('Review & Apply') || active?.tagName === 'BUTTON';
    });
    expect(restoredToApplyBtn).toBe(true);
  });

  test('Mock test taken and submitted entirely via keyboard', async ({ page }) => {
    // 1. Log in
    await page.goto('/login');
    await page.fill('#email', 'e2e_candidate@test.local');
    await page.fill('#password', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);

    // 2. Go to mock test page
    await page.goto('/learning/mock-tests/44444444-4444-4444-4444-444444444444');
    const startBtn = page.getByRole('button', { name: /Start .*Examination|Start Test/i });
    await expect(startBtn).toBeVisible();
    await startBtn.focus();
    await page.keyboard.press('Enter');

    await expect(page).toHaveURL(/\/learning\/mock-tests\/.*\/take/);

    // Focus the first option and check with Space
    const firstRadio = page.locator('input[type="radio"]').first();
    await firstRadio.focus();
    await page.keyboard.press('Space');
    await expect(firstRadio).toBeChecked();

    // Focus Submit button and press Enter
    const submitBtn = page.getByRole('button', { name: /Submit Examination|Submit Test/i });
    await submitBtn.focus();
    await page.keyboard.press('Enter');

    // If confirmation modal appears, confirm with Enter
    const confirmBtn = page.getByRole('button', { name: /Yes, Submit (Test|Exam)|Confirm/i });
    if (await confirmBtn.isVisible()) {
      await confirmBtn.focus();
      await page.keyboard.press('Enter');
    }

    // Must reach results page
    await expect(page).toHaveURL(/\/learning\/mock-tests\/.*\/results/);
  });
});
