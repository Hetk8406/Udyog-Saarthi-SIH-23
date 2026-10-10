import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const AUDIT_PAGES = [
  { name: 'Home Page', path: '/' },
  { name: 'Login Page', path: '/login' },
  { name: 'Register Page', path: '/register' },
  { name: 'Jobs Directory', path: '/jobs' },
  { name: 'Learning Center', path: '/learning' },
  { name: 'Support Desk', path: '/support' },
  { name: 'Terms of Service', path: '/terms' },
  { name: 'Privacy Policy', path: '/privacy' },
];

test.describe('Automated Accessibility Scans (@axe-core/playwright)', () => {

  test.beforeEach(async ({ context }) => {
    await context.addInitScript(() => {
      window.localStorage.setItem('cookie_consent', 'accepted');
    });
  });

  for (const pageInfo of AUDIT_PAGES) {
    test(`${pageInfo.name} (${pageInfo.path}) - Normal Mode`, async ({ page }) => {
      await page.goto(pageInfo.path);
      // Wait for page hydration
      await page.waitForLoadState('domcontentloaded');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      const severeViolations = accessibilityScanResults.violations.filter((v) =>
        ['serious', 'critical'].includes(v.impact ?? '')
      );

      if (severeViolations.length > 0) {
        console.error(`Accessibility violations on ${pageInfo.path}:`, JSON.stringify(severeViolations, null, 2));
      }

      expect(
        severeViolations,
        `Expected 0 serious or critical accessibility violations on ${pageInfo.path}, but found ${severeViolations.length}`
      ).toEqual([]);
    });

    test(`${pageInfo.name} (${pageInfo.path}) - High Contrast Mode`, async ({ page }) => {
      await page.goto(pageInfo.path);
      await page.waitForLoadState('domcontentloaded');

      // Enable platform high-contrast mode class
      await page.evaluate(() => {
        document.documentElement.classList.add('high-contrast');
      });

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      const severeViolations = accessibilityScanResults.violations.filter((v) =>
        ['serious', 'critical'].includes(v.impact ?? '')
      );

      if (severeViolations.length > 0) {
        console.error(`Accessibility violations on ${pageInfo.path} (High Contrast):`, JSON.stringify(severeViolations, null, 2));
      }

      expect(
        severeViolations,
        `Expected 0 serious or critical accessibility violations in high-contrast mode on ${pageInfo.path}, but found ${severeViolations.length}`
      ).toEqual([]);
    });
  }
});
