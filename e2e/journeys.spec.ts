import { test, expect } from '@playwright/test';

test.describe('PRD Section 44 - User Journeys', () => {

  test.beforeEach(async ({ context }) => {
    await context.addInitScript(() => {
      window.localStorage.setItem('cookie_consent', 'accepted');
    });
  });

  test('Journey 1: Register (with terms checkbox) > login > fill profile > find job > apply > track application', async ({ page }) => {
    const timestamp = Date.now();
    const candidateEmail = `cand_journey1_${timestamp}@test.local`;
    const candidatePassword = 'Password123!';
    const candidateName = `Journey Candidate ${timestamp}`;

    // 1. Register with terms checkbox
    await page.goto('/register');
    await expect(page).toHaveTitle(/Register|Udyog Saarthi/);

    await page.fill('#fullName', candidateName);
    await page.fill('#reg-email', candidateEmail);
    await page.fill('#phone', '9876543210');
    await page.fill('#reg-password', candidatePassword);
    await page.fill('#reg-confirm', candidatePassword);

    // Terms checkbox must be checked
    const termsCheckbox = page.locator('#termsConsent');
    await expect(termsCheckbox).not.toBeChecked();
    await termsCheckbox.check();
    await expect(termsCheckbox).toBeChecked();

    // Submit registration
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('h1')).toContainText(/Welcome/i);

    // 2. Fill Candidate Profile
    await page.goto('/dashboard/profile');
    await expect(page.locator('h1')).toContainText(/Profile/i);

    // Fill personal info
    await page.fill('#city', 'Bengaluru');
    await page.fill('#state', 'Karnataka');
    await page.fill('#pincode', '560001');
    await page.fill('#bio', 'Dedicated candidate seeking inclusive employment opportunities.');

    // Save changes
    const saveBtn = page.getByRole('button', { name: 'Save & Continue Later' });
    if (await saveBtn.isVisible()) {
      await saveBtn.click();
    }

    // 3. Find a Job
    await page.goto('/jobs');
    await expect(page.locator('h1')).toContainText(/Find Accessible Jobs|Job Vacancies/i);

    // Verify seeded job "Accessibility QA Analyst" is found
    const jobLink = page.getByRole('link', { name: /Accessibility QA Analyst/i }).first();
    await expect(jobLink).toBeVisible();
    await jobLink.click();

    await expect(page).toHaveURL(/\/jobs\//);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Accessibility QA Analyst/i);

    // 4. Apply to Job
    const applyBtn = page.getByRole('button', { name: /Review & Apply/i });
    await expect(applyBtn).toBeVisible();
    await applyBtn.click();

    // Apply modal appears
    const applyModal = page.locator('div[role="dialog"]');
    await expect(applyModal).toBeVisible();

    // Step 1: Accommodations & notes
    const reviewStepBtn = applyModal.getByRole('button', { name: /Review Application/i });
    await expect(reviewStepBtn).toBeVisible();
    await reviewStepBtn.click();

    // Step 2: Confirm submit
    const confirmBtn = applyModal.getByRole('button', { name: /Submit Application Now|Confirm/i });
    await expect(confirmBtn).toBeVisible();
    await confirmBtn.click();

    // 5. Track Application
    await page.goto('/dashboard/applications');
    await expect(page).toHaveURL(/\/dashboard\/applications/);
    await expect(page.locator('h1')).toContainText(/Track Job Applications|Application Tracker|My Applications/i);

    // Check that Accessibility QA Analyst is present in the list
    await expect(page.getByText(/Accessibility QA Analyst/i).first()).toBeVisible();
  });

  test('Journey 2: Login > open learning > take mock test > see result', async ({ page }) => {
    // 1. Login as seeded candidate
    await page.goto('/login');
    await page.fill('#email', 'e2e_candidate@test.local');
    await page.fill('#password', 'TestPassword123!');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/dashboard/);

    // 2. Open Learning
    await page.goto('/learning');
    await expect(page.locator('h1')).toContainText(/Prepare, Practice & Succeed|Accessible Learning|Examination/i);

    // Find the mock test and start it
    const testLink = page.getByRole('link', { name: /View Instructions & Start Test/i }).first();
    await expect(testLink).toBeVisible();
    await testLink.click();

    await expect(page).toHaveURL(/\/learning\/mock-tests\//);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Digital Accessibility 101/i);

    // 3. Start Mock Test
    const startBtn = page.getByRole('button', { name: /Start .*Examination|Start Test/i });
    await expect(startBtn).toBeVisible();
    await startBtn.click();

    // Wait for the exam engine to load
    await expect(page).toHaveURL(/\/learning\/mock-tests\/.*\/take/, { timeout: 15000 });

    // Answer Question 1
    const firstOption = page.locator('input[type="radio"]').first();
    await firstOption.check();

    // Click Next Question or select Question 2
    const nextBtn = page.getByRole('button', { name: /Next Question/i });
    if (await nextBtn.isVisible()) {
      await nextBtn.click();
      const secondOption = page.locator('input[type="radio"]').first();
      await secondOption.check();
    }

    // Submit Examination
    const submitExamBtn = page.getByRole('button', { name: /Submit Examination|Submit Test/i });
    await expect(submitExamBtn).toBeVisible();
    await submitExamBtn.click();

    // If confirmation modal appears, confirm submission
    const confirmSubmitBtn = page.getByRole('button', { name: /Yes, Submit (Test|Exam)|Confirm/i });
    if (await confirmSubmitBtn.isVisible()) {
      await confirmSubmitBtn.click();
    }

    // 4. See the result
    await expect(page).toHaveURL(/\/learning\/mock-tests\/.*\/results/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Result|Scorecard|Performance Summary/i);
    await expect(page.getByText(/Total Score|Marks Obtained|Score/i).first()).toBeVisible();
  });

  test('Journey 3: Login > create a support ticket > coach replies > candidate sees the reply', async ({ browser }) => {
    const candidateContext = await browser.newContext();
    await candidateContext.addInitScript(() => {
      window.localStorage.setItem('cookie_consent', 'accepted');
    });
    const candidatePage = await candidateContext.newPage();

    // 1. Candidate logs in and creates ticket
    await candidatePage.goto('/login');
    await candidatePage.fill('#email', 'e2e_candidate@test.local');
    await candidatePage.fill('#password', 'TestPassword123!');
    await candidatePage.click('button[type="submit"]');
    await expect(candidatePage).toHaveURL(/\/dashboard/);

    await candidatePage.goto('/support');
    await expect(candidatePage.locator('h1')).toContainText(/Support/i);

    // Open ticket modal
    const raiseTicketBtn = candidatePage.getByRole('button', { name: /\+ New Support Request|Create Request/i }).first();
    await expect(raiseTicketBtn).toBeVisible();
    await raiseTicketBtn.click();

    const uniqueTicketSubject = `Accommodation Query ${Date.now()}`;
    await candidatePage.fill('#ticket-subject', uniqueTicketSubject);
    await candidatePage.fill('#ticket-description', 'Need help requesting a screen reader accommodation for the upcoming test.');

    await candidatePage.click('button[type="submit"]:has-text("Submit Request")');

    // Candidate is redirected to ticket detail page
    await expect(candidatePage).toHaveURL(/\/support\/tickets\//);
    const ticketUrl = candidatePage.url();
    await expect(candidatePage.getByText(uniqueTicketSubject).first()).toBeVisible();

    // 2. Coach logs in in separate context and replies
    const coachContext = await browser.newContext();
    await coachContext.addInitScript(() => {
      window.localStorage.setItem('cookie_consent', 'accepted');
    });
    const coachPage = await coachContext.newPage();

    await coachPage.goto('/login');
    await coachPage.fill('#email', 'e2e_coach@test.local');
    await coachPage.fill('#password', 'TestPassword123!');
    await coachPage.click('button[type="submit"]');
    await expect(coachPage).toHaveURL(/\/coach/);

    // Coach navigates directly to the candidate's ticket URL
    await coachPage.goto(ticketUrl);
    await expect(coachPage.locator('h1')).toContainText(uniqueTicketSubject);

    const coachReplyText = `Hello candidate, I have contacted the exam authority to ensure screen reader support is provided. (Ref: ${Date.now()})`;
    await coachPage.fill('#reply-box', coachReplyText);
    await coachPage.click('button[type="submit"]:has-text("Send Message")');

    // Verify coach sees their sent reply
    await expect(coachPage.getByText(coachReplyText).first()).toBeVisible();

    // 3. Candidate sees coach's reply
    await candidatePage.reload();
    await expect(candidatePage.getByText(coachReplyText).first()).toBeVisible();

    await candidateContext.close();
    await coachContext.close();
  });

  test('Journey 4: Admin creates a job > candidate finds it in search', async ({ browser }) => {
    const adminContext = await browser.newContext();
    await adminContext.addInitScript(() => {
      window.localStorage.setItem('cookie_consent', 'accepted');
    });
    const adminPage = await adminContext.newPage();

    // 1. Admin logs in
    await adminPage.goto('/login');
    await adminPage.fill('#email', 'e2e_admin@test.local');
    await adminPage.fill('#password', 'TestPassword123!');
    await adminPage.click('button[type="submit"]');
    await expect(adminPage).toHaveURL(/\/admin-panel/);

    // Navigate to Jobs tab
    const jobsTab = adminPage.getByRole('button', { name: /Jobs & Vacancies/i });
    await jobsTab.click();

    // Click "+ Post New Job"
    const postJobBtn = adminPage.locator('#create-job-btn');
    await expect(postJobBtn).toBeVisible();
    await postJobBtn.click();

    const uniqueJobTitle = `Inclusive Specialist Admin Posted ${Date.now()}`;
    await adminPage.fill('#new-job-title', uniqueJobTitle);
    await adminPage.fill('#new-job-city', 'New Delhi');
    await adminPage.fill('#new-job-deadline', '2026-12-31');
    await adminPage.fill('#new-job-desc', 'Full-time accessibility role created via admin E2E test.');

    // Submit modal
    await adminPage.click('#submit-job-btn');

    // Verify modal closes and job appears in admin table
    await expect(adminPage.locator('#submit-job-btn')).not.toBeVisible();
    await expect(adminPage.getByText(uniqueJobTitle).first()).toBeVisible();
    await adminContext.close();

    // 2. Candidate finds job in search
    const candidateContext = await browser.newContext();
    await candidateContext.addInitScript(() => {
      window.localStorage.setItem('cookie_consent', 'accepted');
    });
    const candidatePage = await candidateContext.newPage();

    await candidatePage.goto('/jobs');
    await expect(candidatePage.locator('h1')).toContainText(/Find Accessible Jobs|Job Vacancies/i);

    // Search for the newly created job
    const searchInput = candidatePage.locator('#filter-search');
    await searchInput.fill(uniqueJobTitle);

    // Verify job is found
    await expect(candidatePage.getByText(uniqueJobTitle).first()).toBeVisible();

    await candidateContext.close();
  });
});
