const fs = require('fs');
const path = require('path');
const { chromium } = require('@playwright/test');

const SCORESHEETS_DIR = path.join(__dirname, 'scoresheets');
const TEMPLATE_PATH = path.join(__dirname, 'scoresheet.html');
const OUTPUT_HTML_PATH = path.join(SCORESHEETS_DIR, 'all-scoresheets.html');
const OUTPUT_PDF_PATH = path.join(SCORESHEETS_DIR, 'all-scoresheets.pdf');

async function generatePdf() {
  try {
    console.log('Combining all scoresheets into a single HTML file...');
    
    // Read the CSS style block from the scoresheet template
    if (!fs.existsSync(TEMPLATE_PATH)) {
      throw new Error(`Template not found at: ${TEMPLATE_PATH}`);
    }
    const template = fs.readFileSync(TEMPLATE_PATH, 'utf-8');
    const styleBlock = template.match(/<style>[\s\S]*?<\/style>/)[0];

    let combinedBodyContent = '';
    let sheetCount = 0;

    // Scan flat SCORESHEETS_DIR for YYYY-MM-DD.html files
    if (!fs.existsSync(SCORESHEETS_DIR)) {
      throw new Error(`Scoresheets directory not found at: ${SCORESHEETS_DIR}`);
    }

    const files = fs.readdirSync(SCORESHEETS_DIR)
      .filter(file => /^\d{4}-\d{2}-\d{2}\.html$/.test(file))
      .sort(); // String sort of YYYY-MM-DD.html is perfectly chronological

    for (const filename of files) {
      const filePath = path.join(SCORESHEETS_DIR, filename);
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const bodyMatch = fileContent.match(/<body>([\s\S]*?)<\/body>/);
      
      if (!bodyMatch) {
        console.log(`Could not find body in ${filename}`);
        continue;
      }

      const bodyContent = bodyMatch[1].trim();

      if (combinedBodyContent && bodyContent) {
        combinedBodyContent += '\n<div class="page-break"></div>\n';
      }
      
      combinedBodyContent += bodyContent;
      
      const matchSheetMatches = bodyContent.match(/class="match-sheet"/g) || [];
      sheetCount += matchSheetMatches.length;
      
      console.log(`Added date scoresheet: ${filename} (${matchSheetMatches.length} sheets)`);
    }

    if (!combinedBodyContent) {
      throw new Error('No scoresheet content was successfully combined.');
    }

    // Build the full combined HTML document
    const combinedHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>All LTTA Match Scoresheets</title>
    ${styleBlock}
  </head>
  <body>
    ${combinedBodyContent}
  </body>
</html>`;

    // Save the combined HTML file
    fs.writeFileSync(OUTPUT_HTML_PATH, combinedHtml, 'utf-8');
    console.log(`Combined HTML saved to: ${OUTPUT_HTML_PATH}`);
    console.log(`Total match sheets collected: ${sheetCount}`);

    // Launch Playwright and print to PDF
    console.log('Launching browser to compile PDF...');
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    console.log('Loading combined HTML...');
    // Use file:// URL with absolute path
    const fileUrl = `file://${OUTPUT_HTML_PATH}`;
    await page.goto(fileUrl, { waitUntil: 'networkidle' });

    console.log('Printing to PDF...');
    await page.pdf({
      path: OUTPUT_PDF_PATH,
      format: 'Letter',
      printBackground: true,
      margin: {
        top: '0px',
        bottom: '0px',
        left: '0px',
        right: '0px'
      }
    });

    await browser.close();
    console.log(`PDF successfully generated and saved to: ${OUTPUT_PDF_PATH}`);

  } catch (error) {
    console.error('Error generating combined PDF:', error);
    process.exit(1);
  }
}

generatePdf();
