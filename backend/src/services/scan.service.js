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

  // 1. Normalize URL
  let fullUrl = url.trim();
  if (!fullUrl.startsWith('http')) fullUrl = `https://${fullUrl}`;
  if (fullUrl.endsWith('/')) fullUrl = fullUrl.slice(0, -1);

  console.log(`[SCAN-ENGINE] Starting high-precision scan: ${fullUrl}`);

  try {
    browser = await chromium.launch({ 
      headless: true,
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox', 
        '--disable-blink-features=AutomationControlled',
        '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      ]
    });
    
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
    });
    
    const page = await context.newPage();

    // --- STEP 1: INITIAL LOAD ---
    const startTime = Date.now();
    try {
      const response = await page.goto(fullUrl, { waitUntil: 'networkidle', timeout: 30000 });
      result.loadTime = (Date.now() - startTime) / 1000;
      
      if (response.status() >= 400) {
        result.status = 'broken';
        result.issues.push(`Site returned error status: ${response.status()}`);
        return result;
      }

      if (page.url().includes('/password')) {
        result.status = 'warning';
        result.issues.push('Store is password protected (Maintenance Mode)');
        return result;
      }
    } catch (e) {
      result.status = 'issue';
      result.issues.push('Initial connection timeout or DNS failure');
      return result;
    }

    // --- STEP 2: PRODUCT DISCOVERY ---
    try {
      // Shopify priority: specific /products/ path
      const productLink = page.locator('a[href*="/products/"]').first();
      
      if (await productLink.isVisible({ timeout: 5000 })) {
        await productLink.click({ force: true });
      } else {
        // Universal fallback
        console.log('[SCAN] No direct product link, checking collections/all');
        await page.goto(`${fullUrl}/collections/all`, { waitUntil: 'networkidle' }).catch(() => {});
        const fallbackLink = page.locator('a[href*="/products/"], a[href*="/product/"], .product-item a').first();
        if (await fallbackLink.isVisible()) {
          await fallbackLink.click({ force: true });
        } else {
          result.issues.push('Could not find any product to test (Shopify /products/ missing)');
        }
      }
      
      await page.waitForLoadState('domcontentloaded');
      if (page.url().includes('/products/') || page.url().includes('/product/')) {
        result.productPage = true;
      }
    } catch (e) {
      result.issues.push('Failed to navigate to a product page');
    }

    // --- STEP 3: ADD TO CART (WITH VARIANT HANDLING) ---
    if (result.productPage) {
      try {
        // Handle variant selection (if ATC is disabled)
        const selectors = ['button[name="add"]', '#AddToCart', '.add-to-cart', 'button:has-text("Add to Cart")'];
        let atcBtn = null;
        
        for (const sel of selectors) {
          const btn = page.locator(sel).first();
          if (await btn.isVisible()) {
            atcBtn = btn;
            break;
          }
        }

        if (atcBtn) {
          // Check if button is disabled (often requires selecting a size/color)
          const isDisabled = await atcBtn.isDisabled();
          if (isDisabled) {
             console.log('[SCAN] ATC button disabled, attempting variant selection');
             const variantOptions = page.locator('select, .swatch-element, .variant-input').first();
             if (await variantOptions.isVisible()) {
               await variantOptions.click();
               await page.waitForTimeout(1000);
             }
          }

          await atcBtn.click({ force: true });
          
          // --- VERIFICATION: THE SOURCE OF TRUTH ---
          // We wait for the network to settle and then check the internal Shopify Cart API
          await page.waitForTimeout(4000); 
          
          let cartVerified = false;
          try {
            // Method 1: Shopify internal API check (Most reliable for Shopify)
            const cartData = await page.evaluate(async () => {
              try {
                const response = await fetch('/cart.js');
                return await response.json();
              } catch (e) { return null; }
            });

            if (cartData && cartData.item_count > 0) {
              console.log(`[SCAN] Cart API Verified: ${cartData.item_count} items found.`);
              cartVerified = true;
            } 
            
            // Method 2: URL check (If it redirected to /cart)
            if (!cartVerified && page.url().includes('/cart')) {
              cartVerified = true;
            }

            // Method 3: Semantic check (Look for '1' or 'Item' in header cart icons)
            if (!cartVerified) {
              const cartSelectors = ['.cart-count', '#CartCount', '.header__cart-count', '[data-cart-count]'];
              for (const sel of cartSelectors) {
                const countText = await page.locator(sel).first().innerText().catch(() => "");
                if (parseInt(countText.replace(/\D/g, "")) > 0) {
                  cartVerified = true;
                  break;
                }
              }
            }
          } catch (verifyErr) {
            console.log('[SCAN] Verification check skipped or failed, falling back to basic visibility');
          }

          if (cartVerified) {
            result.addToCart = true;
          } else {
            // Final check: Just go to the cart page and see if it is empty
            await page.goto(`${new URL(page.url()).origin}/cart`, { waitUntil: 'networkidle' });
            const bodyText = await page.innerText('body');
            const isEmpty = bodyText.toLowerCase().includes('your cart is empty') || bodyText.toLowerCase().includes('cart is currently empty');
            
            if (!isEmpty) {
              result.addToCart = true;
            } else {
              result.issues.push('Clicked Add to Cart, but the cart remained empty (Verified via API & Cart Page)');
            }
          }
        } else {
          result.issues.push('Add to Cart button [name="add"] not found on product page');
        }
      } catch (e) {
        result.issues.push('Error during Add to Cart interaction');
      }
    }

    // --- STEP 4: CHECKOUT VERIFICATION ---
    if (result.addToCart) {
      try {
        // Force navigation to /cart to be certain
        if (!page.url().includes('/cart')) {
          await page.goto(`${new URL(page.url()).origin}/cart`, { waitUntil: 'networkidle' });
        }

        const checkoutBtn = page.locator('button[name="checkout"], [href*="/checkout"], .checkout-button').first();
        
        if (await checkoutBtn.isVisible({ timeout: 5000 })) {
          // Verification: Check if it's disabled
          if (await checkoutBtn.isDisabled()) {
            result.issues.push('Checkout button found but it is currently disabled');
          } else {
            result.checkoutPage = true;
          }
        } else {
          result.issues.push('Checkout button not found on the Cart page');
        }
      } catch (e) {
        result.issues.push('Failed to verify checkout availability');
      }
    }

    // Final Determination
    if (!result.checkoutPage || !result.addToCart || !result.productPage) {
      if (result.status === 'healthy') result.status = 'issue';
    }

    console.log(`[SCAN-FINISHED] Store: ${fullUrl} | Status: ${result.status.toUpperCase()}`);

  } catch (error) {
    console.error(`[SCAN-CRASH] ${error.message}`);
    result.status = 'issue';
    result.issues.push(`Engine Error: ${error.message}`);
  } finally {
    if (browser) await browser.close();
  }

  return result;
};



