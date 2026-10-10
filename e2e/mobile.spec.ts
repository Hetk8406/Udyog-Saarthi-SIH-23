import { test, expect } from '@playwright/test';

test.describe('Mobile Viewport (375px) Journeys', () => {

  test.beforeEach(async ({ context }) => {
    await context.addInitScript(() => {
      window.localStorage.setItem('cookie_consent', 'accepted');
    });
  });

  test('Mobile: Candidate can log in and view responsive dashboard', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/login');
    await expect(page.locator('h1')).toBeVisible();

    await page.fill('#email', 'e2e_candidate@test.local');
    await page.fill('#password', 'TestPassword123!');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('h1')).toContainText(/Welcome/i);

    // Verify no unexpected horizontal page overflow
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);
  });

  test('Mobile: Candidate can search jobs and complete application flow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // 1. Log in
    await page.goto('/login');
    await page.fill('#email', 'e2e_candidate@test.local');
    await page.fill('#password', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);

    // 2. Open Jobs
    await page.goto('/jobs');
    const jobLink = page.getByRole('link', { name: /Accessibility QA Analyst/i }).first();
    await expect(jobLink).toBeVisible();
    await jobLink.click();

    await expect(page).toHaveURL(/\/jobs\//);

    // 3. Open Apply Modal on mobile
    const applyBtn = page.getByRole('button', { name: /Review & Apply/i });
    await expect(applyBtn).toBeVisible();
    await applyBtn.click();

    const applyModal = page.locator('div[role="dialog"]');
    await expect(applyModal).toBeVisible();

    // Proceed through steps
    const reviewStepBtn = applyModal.getByRole('button', { name: /Review Application/i });
    await expect(reviewStepBtn).toBeVisible();
    await reviewStepBtn.click();

    const confirmBtn = applyModal.getByRole('button', { name: /Submit Application Now|Confirm/i });
    await expect(confirmBtn).toBeVisible();
    await confirmBtn.click();

    // 4. Verify in applications list
    await page.goto('/dashboard/applications');
    await expect(page.getByText(/Accessibility QA Analyst/i).first()).toBeVisible();
  });

  test('Mobile: Candidate can complete a mock test', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // 1. Log in
    await page.goto('/login');
    await page.fill('#email', 'e2e_candidate@test.local');
    await page.fill('#password', 'TestPassword123!');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);

    // 2. Navigate to test via learning page
    await page.goto('/learning');
    const testLink = page.getByRole('link', { name: /View Instructions & Start Test/i }).first();
    await expect(testLink).toBeVisible();
    await testLink.click();

    await expect(page).toHaveURL(/\/learning\/mock-tests\//);
    const startBtn = page.getByRole('button', { name: /Start .*Examination|Start Test/i });
    await expect(startBtn).toBeVisible();
    await startBtn.click();

    await expect(page).toHaveURL(/\/learning\/mock-tests\/.*\/take/);

    // Answer first question
    const firstOption = page.locator('input[type="radio"]').first();
    await firstOption.check();

    // Submit
    const submitBtn = page.getByRole('button', { name: /Submit Examination|Submit Test/i });
    await expect(submitBtn).toBeVisible();
    await submitBtn.click();

    const confirmBtn = page.getByRole('button', { name: /Yes, Submit (Test|Exam)|Confirm/i });
    if (await confirmBtn.isVisible()) {
      await confirmBtn.click();
    }

    // Results screen
    await expect(page).toHaveURL(/\/learning\/mock-tests\/.*\/results/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Result|Scorecard|Performance Summary/i);
  });
});
