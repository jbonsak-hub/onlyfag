// Refresh the quiz snapshot after editing the public country/place reference tables.
const fs = require('node:fs');
const path = require('node:path');
const {
  pathToFileURL
} = require('node:url');
const {
  chromium
} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.BROWSER_EXECUTABLE || undefined
  });
  try {
    const page = await browser.newPage();
    // Keep this maintenance task offline, including analytics and live data refreshes.
    await page.route('https://**', route => route.abort());
    await page.goto(pathToFileURL(path.resolve(__dirname, '../geografi.html')).href);
    const data = await page.evaluate(() => ({
      ...getWorldData(),
      landRows: getLandRows()
    }));
    fs.writeFileSync(path.resolve(__dirname, '../assets/geography/quiz-data.js'), '// Public data from the unchanged geography reference tables; no user data.\nwindow.GEO_QUIZ_DATA=' + JSON.stringify(data) + ';\n');
    console.log('Updated public quiz data:', data.countries.length, 'countries,', data.places.length, 'places');
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
