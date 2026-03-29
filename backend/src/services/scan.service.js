const { chromium } = require('playwright');

exports.runStoreScan = async (url) => {
  const result = {
    status: 'healthy',
    loadTime: 0,
    productPage: false,
    addToCart: false,
    checkoutPage: false,
    issues: []
  };

  let browser;

  // Add protocol if missing
  const fullUrl = url.startsWith('http') ? url : `https://${url}`;

  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    // 1. Measure load time
    const startTime = Date.now();
    try {
      await page.goto(fullUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
      result.loadTime = (Date.now() - startTime) / 1000;
      
      if (result.loadTime > 5) {
        result.status = 'warning';
        result.issues.push(`Slow page load: ${result.loadTime.toFixed(1)}s`);
      }
    } catch (e) {
      result.status = 'broken';
      result.issues.push('Failed to load store URL');
      return result; // Exit early if we can't even load the page
    }

    // Since this is a generic bot dealing with unknown store structures, 
    // it uses broad selectors as examples.
    // In reality, this requires platform-specific selectors (Shopify, WooCommerce, etc).

    // 2. Find Product Page
    try {
      // Find ANY link that looks remotely like a product or image
      const productLink = await page.locator('a[href*="/product"], a[href*="/p/"], .product a, form[action*="/cart"] > a, a > img').first();
      if (await productLink.isVisible({ timeout: 5000 })) {
        // Try forcing navigation without waiting for the click animation if blocked by cookie banners
        const href = await productLink.getAttribute('href');
        if (href) {
          await page.goto(href.startsWith('http') ? href : `${fullUrl}${href}`, { waitUntil: 'domcontentloaded' });
        } else {
          await productLink.click({ force: true });
        }
        await page.waitForLoadState('domcontentloaded');
        result.productPage = true;
      } else {
        result.issues.push('Could not find any product or image links on the homepage.');
      }
    } catch (e) {
      result.issues.push('Failed navigating to a product page. A popup or anti-bot screen might be blocking the view.');
    }

    // 3. Add to Cart (Loose Regex Matching)
    if (result.productPage) {
      try {
        const addToCartBtn = page.getByRole('button', { name: /(add to cart|add to bag|buy now|add)/i }).first();
        if (await addToCartBtn.isVisible({ timeout: 5000 })) {
          await addToCartBtn.click({ force: true }); // force true ignores overlapping cookie popups
          await page.waitForTimeout(3000); // Wait for cart animations
          result.addToCart = true;
        } else {
          // Fallback check
          const fallbackBtn = page.locator('button[name="add"], button:has-text("🛒")').first();
          if (await fallbackBtn.isVisible()) {
             await fallbackBtn.click({ force: true });
             result.addToCart = true;
          } else {
             result.issues.push('Add to Cart button was completely missing from the product view.');
          }
        }
      } catch (e) {
        result.issues.push('Failed to interact with the Add to Cart button.');
      }
    }

    // 4. Click Checkout (Loose Regex Matching)
    if (result.addToCart) {
      try {
        let checkoutBtn = page.getByRole('button', { name: /(checkout|check out|secure checkout|pay now)/i }).first();
        let checkoutLink = page.locator('a[href*="checkout"]').first();

        if (!(await checkoutBtn.isVisible({ timeout: 2000 })) && !(await checkoutLink.isVisible({ timeout: 500 }))) {
           // Explicitly force navigation to cart if no side-cart is visible
           await page.goto(`${fullUrl}/cart`, { waitUntil: 'domcontentloaded' });
           checkoutBtn = page.getByRole('button', { name: /(checkout|check out|pay)/i }).first();
           checkoutLink = page.locator('a[href*="checkout"], input[name="checkout"]').first();
        }

        if (await checkoutBtn.isVisible({ timeout: 5000 }) || await checkoutLink.isVisible({ timeout: 5000 })) {
          // Instead of actually clicking it (which often triggers Stripe/Shopify bot detection)
          // we merely verify it exists and is clickable! This prevents false failure reports!
          result.checkoutPage = true;
        } else {
          result.issues.push('Checkout button not visible anywhere on the Cart or Slide-out.');
        }
      } catch (e) {
        result.issues.push('Failed finding the checkout route.');
      }
    }

    // Final Status Determination
    if (!result.checkoutPage || !result.addToCart || !result.productPage) {
      result.status = 'broken';
    }

  } catch (error) {
    result.status = 'broken';
    result.issues.push(`Critical Bot Error: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  return result;
};
