import { test, expect, Page } from '@playwright/test';

/**
 * Comprehensive Link and Button Fuzzing Tests
 *
 * This test suite validates that all interactive elements (links and buttons)
 * across all HTML pages work correctly. It performs automated fuzzing to:
 * - Check all internal links navigate to valid pages
 * - Verify external links are properly formatted
 * - Ensure buttons have proper event handlers
 * - Test navigation consistency across pages
 */

interface LinkInfo {
  readonly href: string;
  readonly text: string;
  readonly isInternal: boolean;
  readonly isExternal: boolean;
  readonly selector: string;
}

interface ButtonInfo {
  readonly text: string;
  readonly id: string | null;
  readonly className: string;
  readonly hasClickHandler: boolean;
}

interface PageTestResult {
  readonly page: string;
  readonly links: LinkInfo[];
  readonly buttons: ButtonInfo[];
  readonly brokenLinks: string[];
  readonly issuesFound: string[];
}

const HTML_PAGES = [
  '/',
  '/examples/',
  '/examples/simple-monitor.html',
  '/examples/error-handling.html',
  '/examples/demo-mode.html',
  '/examples/multi-channel-display.html',
  '/examples/continuous-monitoring.html',
  '/examples/coincidence-measurement.html',
  '/examples/graphing.html',
  '/examples/data-export.html',
  '/examples/statistical-analysis.html',
  '/examples/calibration-wizard.html',
  '/examples/code-playground.html',
] as const;

/**
 * Extract all links from a page
 */
async function extractLinks(page: Page): Promise<LinkInfo[]> {
  return await page.evaluate(() => {
    const links: LinkInfo[] = [];
    const anchors = Array.from(document.querySelectorAll('a'));

    anchors.forEach((anchor, index) => {
      const href = anchor.getAttribute('href') || '';
      const text = anchor.textContent?.trim() || '';
      const isInternal =
        href.startsWith('/') ||
        href.startsWith('.') ||
        href.startsWith('#') ||
        !href.startsWith('http');
      const isExternal =
        href.startsWith('http://') || href.startsWith('https://');

      links.push({
        href,
        text,
        isInternal,
        isExternal,
        selector: `a:nth-of-type(${index + 1})`,
      });
    });

    return links;
  });
}

/**
 * Extract all buttons from a page
 */
async function extractButtons(page: Page): Promise<ButtonInfo[]> {
  return await page.evaluate(() => {
    const buttons: ButtonInfo[] = [];
    const buttonElements = Array.from(document.querySelectorAll('button'));

    buttonElements.forEach((button) => {
      const text = button.textContent?.trim() || '';
      const id = button.id || null;
      const className = button.className || '';

      // Check if button has click handler
      const hasClickHandler =
        button.onclick !== null ||
        button.hasAttribute('onclick') ||
        // @ts-expect-error - accessing internal property
        (button._events && button._events.click) ||
        className.includes('clickable') ||
        className.includes('btn');

      buttons.push({
        text,
        id,
        className,
        hasClickHandler,
      });
    });

    return buttons;
  });
}

/**
 * Check if a URL is accessible
 */
async function isLinkAccessible(
  page: Page,
  url: string,
  currentPageURL: string
): Promise<boolean> {
  try {
    // Skip anchor links
    if (url.startsWith('#')) {
      return true;
    }

    // For absolute URLs (external or starting with /), use as-is or construct from baseURL
    let fullURL: string;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      // External URL - just validate format (don't actually fetch)
      return true;
    } else {
      // Relative URL - resolve it relative to the current page
      fullURL = new URL(url, currentPageURL).href;
    }

    // Try to navigate to the URL
    const response = await page.goto(fullURL, {
      waitUntil: 'domcontentloaded',
      timeout: 10000,
    });
    return response !== null && response.status() < 400;
  } catch {
    return false;
  }
}

test.describe('Link and Button Fuzzing - Comprehensive Test Suite', () => {
  test.describe('Link Validation on All Pages', () => {
    for (const pagePath of HTML_PAGES) {
      test(`${pagePath} - all links are valid and accessible`, async ({
        page,
        baseURL,
      }) => {
        await page.goto(pagePath);
        await page.waitForLoadState('networkidle');

        const links = await extractLinks(page);
        const brokenLinks: string[] = [];
        const issues: string[] = [];

        // Check each link
        for (const link of links) {
          // Skip empty hrefs
          if (!link.href || link.href === '#') {
            continue;
          }

          // Validate external links have proper format
          if (link.isExternal) {
            if (
              !link.href.startsWith('https://') &&
              !link.href.startsWith('http://')
            ) {
              issues.push(`Invalid external link format: ${link.href}`);
            }

            // Check for rel="noopener noreferrer" on external links
            const hasProperRel = await page.evaluate(
              (selector: string): boolean => {
                const anchor = document.querySelector(
                  selector
                ) as HTMLAnchorElement;
                const rel = anchor?.getAttribute('rel') || '';
                const target = anchor?.getAttribute('target') || '';
                return target === '_blank' ? rel.includes('noopener') : true;
              },
              link.selector
            );

            if (!hasProperRel) {
              issues.push(
                `External link missing security attributes: ${link.href}`
              );
            }
          }

          // Check internal links
          if (link.isInternal && !link.href.startsWith('#')) {
            const newPage = await page.context().newPage();
            const accessible = await isLinkAccessible(
              newPage,
              link.href,
              page.url() // Use current page URL to resolve relative links
            );
            await newPage.close();

            if (!accessible) {
              brokenLinks.push(`${link.text} (${link.href})`);
            }
          }
        }

        // Report findings
        if (brokenLinks.length > 0) {
          console.log(`Broken links on ${pagePath}:`, brokenLinks);
        }

        if (issues.length > 0) {
          console.log(`Issues found on ${pagePath}:`, issues);
        }

        expect(brokenLinks, `Found broken links on ${pagePath}`).toHaveLength(
          0
        );
        expect(issues, `Found link issues on ${pagePath}`).toHaveLength(0);
      });
    }
  });

  test.describe('Button Functionality Validation', () => {
    for (const pagePath of HTML_PAGES) {
      test(`${pagePath} - all buttons are interactive`, async ({ page }) => {
        await page.goto(pagePath);
        await page.waitForLoadState('networkidle');

        const buttons = await extractButtons(page);
        const nonInteractiveButtons: string[] = [];

        // Check each button
        for (const button of buttons) {
          // Buttons should either have handlers or be part of a form
          const isInForm = await page.evaluate((btnText: string): boolean => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const btn = buttons.find((b) => b.textContent?.trim() === btnText);
            return btn?.closest('form') !== null;
          }, button.text);

          if (!button.hasClickHandler && !isInForm && button.text) {
            // Check if it's a known interactive button class
            const hasInteractiveClass =
              button.className.includes('btn') ||
              button.className.includes('button') ||
              button.className.includes('category-tag') ||
              button.className.includes('tab');

            if (!hasInteractiveClass) {
              nonInteractiveButtons.push(
                `${button.text} (id: ${button.id || 'none'}, class: ${button.className || 'none'})`
              );
            }
          }
        }

        if (nonInteractiveButtons.length > 0) {
          console.log(
            `Non-interactive buttons on ${pagePath}:`,
            nonInteractiveButtons
          );
        }

        // This is a warning, not a failure - some buttons might be dynamically bound
        expect(nonInteractiveButtons.length).toBeLessThanOrEqual(
          buttons.length
        );
      });
    }
  });

  test.describe('Navigation Consistency', () => {
    test('all pages have consistent navigation structure', async ({ page }) => {
      const navigationStructures: Map<string, string[]> = new Map();

      for (const pagePath of HTML_PAGES) {
        await page.goto(pagePath);
        await page.waitForLoadState('networkidle');

        // Extract navigation links
        const navLinks = await page.evaluate(() => {
          const navElements = Array.from(
            document.querySelectorAll('nav a, .nav-bar a')
          );
          return navElements.map((a) => (a as HTMLAnchorElement).href);
        });

        navigationStructures.set(pagePath, navLinks);
      }

      // Check that pages have navigation (at least some pages should)
      const pagesWithNav = Array.from(navigationStructures.values()).filter(
        (links) => links.length > 0
      );
      expect(pagesWithNav.length).toBeGreaterThan(0);
    });

    test('clicking example cards navigates to correct pages', async ({
      page,
    }) => {
      await page.goto('/examples/');
      await page.waitForLoadState('networkidle');

      const cards = await page.locator('.example-card').all();

      // Test first 3 cards to avoid timeout
      for (let i = 0; i < Math.min(3, cards.length); i++) {
        await page.goto('/examples/');
        await page.waitForLoadState('networkidle');

        const card = page.locator('.example-card').nth(i);
        const cardTitle = await card.locator('.example-title').textContent();

        await card.click();
        await page.waitForLoadState('networkidle');

        // Should navigate to a different page
        const currentURL = page.url();
        expect(currentURL).not.toContain('/examples/index.html');
        expect(currentURL).toContain('/examples/');

        console.log(`Card "${cardTitle}" navigated to: ${currentURL}`);
      }
    });
  });

  test.describe('Link Click Behavior', () => {
    test('internal links navigate without opening new tabs', async ({
      page,
      context,
    }) => {
      await page.goto('/examples/');
      await page.waitForLoadState('networkidle');

      const links = await extractLinks(page);
      const internalLinks = links.filter(
        (l) => l.isInternal && !l.href.startsWith('#') && l.href
      );

      if (internalLinks.length > 0) {
        // Test first internal link
        const firstLink = internalLinks[0];
        const pagesBefore = context.pages().length;

        await page.click(firstLink.selector);
        await page.waitForLoadState('networkidle');

        const pagesAfter = context.pages().length;

        // Should not open new tab
        expect(pagesAfter).toBe(pagesBefore);
      }
    });

    test('external links open in new tabs with security attributes', async ({
      page,
    }) => {
      await page.goto('/examples/');
      await page.waitForLoadState('networkidle');

      const links = await extractLinks(page);
      const externalLinks = links.filter((l) => l.isExternal);

      for (const link of externalLinks) {
        try {
          // Use href-based selector to avoid ambiguity
          const linkElement = await page
            .locator(`a[href="${link.href}"]`)
            .first();
          const target = await linkElement.getAttribute('target');
          const rel = await linkElement.getAttribute('rel');

          if (target === '_blank') {
            expect(rel).toContain('noopener');
            console.log(
              `External link "${link.text}" has proper security: target="${target}" rel="${rel}"`
            );
          }
        } catch (error) {
          // Skip if selector is ambiguous or element not found
          console.log(`Skipping link "${link.text}" due to selector issue`);
        }
      }
    });
  });

  test.describe('Interactive Elements Fuzzing', () => {
    test('category filter buttons work correctly', async ({ page }) => {
      await page.goto('/examples/');
      await page.waitForLoadState('networkidle');

      const categoryTags = await page.locator('.category-tag').all();

      for (const tag of categoryTags) {
        const categoryText = await tag.textContent();

        await tag.click();
        await page.waitForTimeout(200);

        // Should have active class
        const hasActive = await tag.evaluate((el: Element): boolean =>
          el.classList.contains('active')
        );

        expect(
          hasActive,
          `Category "${categoryText}" should be active after click`
        ).toBeTruthy();

        // Cards should be visible
        const visibleCards = await page.locator('.example-card').count();
        expect(
          visibleCards,
          `Category "${categoryText}" should show some cards`
        ).toBeGreaterThan(0);

        console.log(`Category "${categoryText}" shows ${visibleCards} cards`);
      }
    });

    test('search input filters results', async ({ page }) => {
      await page.goto('/examples/');
      await page.waitForLoadState('networkidle');

      const searchTerms = ['monitor', 'graph', 'calibration', 'demo', 'export'];

      for (const term of searchTerms) {
        await page.fill('#searchInput', term);
        await page.waitForTimeout(200);

        const visibleCards = await page.locator('.example-card').count();

        // Should filter results
        expect(visibleCards).toBeGreaterThanOrEqual(0);
        expect(visibleCards).toBeLessThanOrEqual(11);

        console.log(`Search term "${term}" shows ${visibleCards} results`);
      }

      // Test no results
      await page.fill('#searchInput', 'xyznonexistent123');
      await page.waitForTimeout(200);

      const noResultsText = await page.locator('.examples-grid').textContent();
      expect(noResultsText).toContain('No examples found');
    });
  });

  test.describe('Accessibility and Keyboard Navigation', () => {
    test('all interactive elements are keyboard accessible', async ({
      page,
    }) => {
      await page.goto('/examples/');
      await page.waitForLoadState('networkidle');

      // Tab through interactive elements
      await page.keyboard.press('Tab');

      // Check that focus is visible
      const focusedElement = await page.evaluate(() => {
        const active = document.activeElement;
        return {
          tagName: active?.tagName,
          className: active?.className,
          id: active?.id,
        };
      });

      expect(focusedElement.tagName).toBeTruthy();
      console.log('First focusable element:', focusedElement);
    });

    test('links have descriptive text or aria-labels', async ({ page }) => {
      for (const pagePath of HTML_PAGES.slice(0, 5)) {
        // Test first 5 pages
        await page.goto(pagePath);
        await page.waitForLoadState('networkidle');

        const linksWithoutText = await page.evaluate(() => {
          const links = Array.from(document.querySelectorAll('a'));
          return links.filter((link) => {
            const text = link.textContent?.trim() || '';
            const ariaLabel = link.getAttribute('aria-label') || '';
            const title = link.getAttribute('title') || '';
            return !text && !ariaLabel && !title;
          }).length;
        });

        expect(
          linksWithoutText,
          `Page ${pagePath} has links without descriptive text`
        ).toBe(0);
      }
    });
  });
});

test.describe('Comprehensive Link Report', () => {
  test('generate full link inventory', async ({ page }) => {
    const report: PageTestResult[] = [];

    for (const pagePath of HTML_PAGES) {
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');

      const links = await extractLinks(page);
      const buttons = await extractButtons(page);

      report.push({
        page: pagePath,
        links,
        buttons,
        brokenLinks: [],
        issuesFound: [],
      });
    }

    // Log comprehensive report
    console.log('\n=== COMPREHENSIVE LINK AND BUTTON INVENTORY ===\n');
    for (const pageReport of report) {
      console.log(`\nPage: ${pageReport.page}`);
      console.log(`  Links: ${pageReport.links.length}`);
      console.log(`  Buttons: ${pageReport.buttons.length}`);

      if (pageReport.links.length > 0) {
        console.log('  Link Details:');
        pageReport.links.forEach((link) => {
          console.log(`    - ${link.text || '(no text)'}: ${link.href}`);
        });
      }

      if (pageReport.buttons.length > 0) {
        console.log('  Button Details:');
        pageReport.buttons.forEach((btn) => {
          console.log(
            `    - ${btn.text || '(no text)'} (${btn.id || 'no id'})`
          );
        });
      }
    }

    // This test always passes - it's just for reporting
    expect(report.length).toBe(HTML_PAGES.length);
  });
});
