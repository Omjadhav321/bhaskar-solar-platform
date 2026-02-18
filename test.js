const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // Capture console logs
    page.on('console', msg => console.log('BROWSER:', msg.text()));

    // Load the page
    const filePath = 'file://' + path.resolve(__dirname, 'index.html');
    await page.goto(filePath, { waitUntil: 'networkidle0' });

    console.log('Page loaded successfully');

    // Test 1: Check login page is visible
    const loginVisible = await page.$eval('#loginPage', el => el.classList.contains('active'));
    console.log('Login page visible:', loginVisible);

    // Test 2: Fill in customer login form
    await page.type('#customerPhone', '1234567890');
    await page.type('#customerAddress', '123 Test Street');
    await page.type('#customerCode', 'SV-2023-001');

    // Test 3: Click login button
    await page.click('button[onclick="doCustomerLogin()"]');

    // Wait for dashboard to appear
    await page.waitForSelector('#customerDashboard.active', { timeout: 5000 });
    console.log('Customer dashboard displayed after login: true');

    // Test 4: Check logout works
    await page.click('button[onclick="logout()"]');
    await page.waitForSelector('#loginPage.active', { timeout: 5000 });
    console.log('Logout works: true');

    // Test 5: Test vendor login
    await page.click('.tab-btn[data-tab="vendor"]');
    await page.waitForSelector('#vendorLogin.active', { timeout: 2000 });
    await page.type('#vendorPhone', '9876543210');
    await page.type('#vendorAddress', '456 Vendor Ave');
    await page.type('#vendorCode', 'VN-2023-999');
    await page.click('button[onclick="doVendorLogin()"]');

    await page.waitForSelector('#vendorDashboard.active', { timeout: 5000 });
    console.log('Vendor dashboard displayed after login: true');

    console.log('\n✓ All tests PASSED!');

    await browser.close();
})().catch(err => {
    console.error('Test failed:', err.message);
    process.exit(1);
});
