const puppeteer = require('puppeteer');
const path = require('path');

async function generatePDFs() {
  const browser = await puppeteer.launch({ headless: true });

  const waivers = [
    { html: '../mountain-island/index.html', pdf: 'Mountain-Island-Lake-Waiver.pdf' },
    { html: '../bells-marina/index.html', pdf: 'Bells-Marina-Waiver.pdf' },
    { html: '../cape-fear/index.html', pdf: 'Cape-Fear-Waiver.pdf' },
  ];

  for (const { html, pdf } of waivers) {
    const page = await browser.newPage();
    const filePath = path.resolve(__dirname, html);
    await page.goto('file://' + filePath, { waitUntil: 'networkidle0', timeout: 15000 });

    // Hide interactive elements for print
    await page.evaluate(() => {
      // Hide submit button, success screen, error msg, signature canvas
      const hide = ['.submit-area', '.success-screen', '.error-msg', '.sig-canvas-wrap', '.sig-clear'];
      hide.forEach(sel => {
        const el = document.querySelector(sel);
        if (el) el.style.display = 'none';
      });
      // Replace checkboxes with checkbox character
      document.querySelectorAll('.ack-item input[type="checkbox"]').forEach(cb => {
        const span = document.createElement('span');
        span.textContent = '\u2610 ';
        span.style.fontSize = '1.2em';
        span.style.marginRight = '0.5em';
        cb.parentNode.replaceChild(span, cb);
      });
      // Replace form inputs with underlines
      document.querySelectorAll('.form-row input').forEach(input => {
        const line = document.createElement('div');
        line.style.borderBottom = '1px solid #999';
        line.style.height = '28px';
        line.style.marginTop = '4px';
        input.parentNode.replaceChild(line, input);
      });
      // Add signature line
      const sigWrap = document.querySelector('.sig-canvas-wrap');
      if (sigWrap) {
        const line = document.createElement('div');
        line.style.borderBottom = '1px solid #999';
        line.style.height = '60px';
        line.style.marginTop = '4px';
        sigWrap.parentNode.replaceChild(line, sigWrap);
      }
    });

    const outPath = path.resolve(__dirname, pdf);
    await page.pdf({
      path: outPath,
      format: 'Letter',
      margin: { top: '0.5in', right: '0.5in', bottom: '0.5in', left: '0.5in' },
      printBackground: true
    });

    console.log('Created: ' + outPath);
    await page.close();
  }

  await browser.close();
}

generatePDFs().catch(e => { console.error(e); process.exit(1); });
