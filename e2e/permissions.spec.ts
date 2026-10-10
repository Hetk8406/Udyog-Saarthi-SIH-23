import { test, expect } from '@playwright/test';

test.describe('Role & Permission Boundary Checks in the Browser', () => {

  test.beforeEach(async ({ context }) => {
    await context.addInitScript(() => {
      window.localStorage.setItem('cookie_consent', 'accepted');
    });
  });

  test('Logged-out visitor opening /dashboard is redirected to /login', async ({ page }) => {
    // Navigate directly to protected dashboard while unauthenticated
    await page.goto('/dashboard');

    // Must be redirected to /login
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('h1')).toContainText(/Log In/i);
  });

  test('Candidate opening /admin-panel is blocked with Access Denied', async ({ page }) => {
    // 1. Log in as a Candidate
    await page.goto('/login');
    await page.fill('#email', 'e2e_candidate@test.local');
    await page.fill('#password', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);

    // 2. Candidate attempts to access the admin panel directly
    await page.goto('/admin-panel');

    // Must be blocked with Access Restricted / Access Denied
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Access (Restricted|Denied)/i);
    await expect(page.getByText(/administrative authority|administrators may view|Admin privileges/i).first()).toBeVisible();

    // Sensitive admin controls must NOT be visible
    await expect(page.locator('#create-job-btn')).not.toBeVisible();
    await expect(page.locator('table')).not.toBeVisible();
  });

  test("Candidate cannot view another candidate's private profile URL", async ({ page }) => {
    // 1. Log in as Candidate A (e2e_candidate@test.local)
    await page.goto('/login');
    await page.fill('#email', 'e2e_candidate@test.local');
    await page.fill('#password', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);

    // 2. Attempt to view Candidate B's profile directly (deterministic UUID seeded)
    const otherCandidateProfileId = '22222222-2222-2222-2222-222222222222';
    await page.goto(`/candidates/${otherCandidateProfileId}`);

    // Must be blocked with 403 Access Denied
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Access (Restricted|Denied)/i);
    await expect(page.getByText(/You do not have permission to view this candidate profile/i).first()).toBeVisible();
  });
});
