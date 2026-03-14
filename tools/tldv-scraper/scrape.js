#!/usr/bin/env node
'use strict';

/**
 * tl;dv Transcript Scraper
 *
 * Extracts meeting transcripts from tl;dv using Playwright.
 * Saves each transcript as a markdown file.
 *
 * Usage:
 *   node scrape.js              # First run: opens browser for login, saves session
 *   node scrape.js --scrape     # Scrape all meetings using saved session
 *   node scrape.js --limit 10   # Scrape only first 10 meetings
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const AUTH_FILE = path.join(__dirname, '.auth.json');
const DRIVE_DIR = '/Users/luizfosc/Library/CloudStorage/GoogleDrive-luizfosc@gmail.com/.shortcut-targets-by-id/1b2DqeBvE_0aH_REqLVWWqrIGQu6wyQDF/Ensinio - Gui e Fosc/BANCO DE DADOS/Transcrição das Reuniões TLDV';
const OUTPUT_DIR = fs.existsSync(path.dirname(DRIVE_DIR)) ? DRIVE_DIR : path.join(__dirname, 'transcripts');
const MEETINGS_URL = 'https://tldv.io/app/meetings';

// Parse CLI args
const args = process.argv.slice(2);
const shouldScrape = args.includes('--scrape');
const limitIdx = args.indexOf('--limit');
const limit = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : Infinity;

async function login() {
  console.log('[LOGIN] Opening browser for manual login...');
  console.log('[LOGIN] Log in to tl;dv, then close the browser when done.\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(MEETINGS_URL);

  // Wait for user to login and land on meetings page
  await page.waitForURL('**/app/meetings**', { timeout: 300000 });
  console.log('[LOGIN] Detected meetings page. Waiting 5s for full load...');
  await page.waitForTimeout(5000);

  // Save session state
  await context.storageState({ path: AUTH_FILE });
  console.log(`[LOGIN] Session saved to ${AUTH_FILE}`);
  console.log('[LOGIN] Now run: node scrape.js --scrape\n');

  await browser.close();
}

async function loadAllMeetings(page, limit) {
  console.log('[COLLECT] Loading meetings page...');

  await page.goto(MEETINGS_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(8000);

  // Click "Carregar reunioes mais antigas" until we have enough cards
  let clickCount = 0;
  let cardCount = await page.locator('[data-testid="tldv-card"]').count();

  while (cardCount < limit) {
    const loadMoreBtn = page.getByText('Carregar reuniões mais antigas');
    const isVisible = await loadMoreBtn.isVisible().catch(() => false);

    if (!isVisible) {
      const loadMoreEn = page.getByText('Load older meetings');
      const isVisibleEn = await loadMoreEn.isVisible().catch(() => false);
      if (!isVisibleEn) break;
      await loadMoreEn.click();
    } else {
      await loadMoreBtn.click();
    }

    clickCount++;
    cardCount = await page.locator('[data-testid="tldv-card"]').count();
    console.log(`[COLLECT] Clicked "load more" ${clickCount} time(s)... (${cardCount} cards)`);
    await page.waitForTimeout(2000);
  }
  console.log(`[COLLECT] Found ${cardCount} meeting cards.\n`);
  return cardCount;
}

async function collectMeetingUrlsByClicking(page, cardCount, maxCards) {
  const total = Math.min(cardCount, maxCards);
  console.log(`[COLLECT] Collecting URLs for ${total} meetings by clicking each card...\n`);

  const meetingUrls = [];

  for (let i = 0; i < total; i++) {
    try {
      // Make sure we're on the meetings list page
      if (!page.url().includes('/app/meetings')) {
        await page.goto(MEETINGS_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForTimeout(5000);
      }

      // Click the card at index i
      const cards = page.locator('[data-testid="tldv-card"]');
      const card = cards.nth(i);

      // Get card title for logging
      const cardText = await card.innerText().catch(() => 'unknown');
      const title = cardText.split('\n')[0].slice(0, 50);

      // Click the thumbnail/image area of the card (more reliable)
      const thumbnail = card.locator('img').first();
      const hasThumbnail = await thumbnail.isVisible().catch(() => false);

      if (hasThumbnail) {
        await thumbnail.click();
      } else {
        await card.click();
      }

      // Wait for URL to change from the list page
      await page.waitForFunction(
        (listUrl) => window.location.href !== listUrl && window.location.href.includes('/app/meetings/'),
        MEETINGS_URL,
        { timeout: 10000 }
      ).catch(() => null);
      await page.waitForTimeout(1000);

      const url = page.url();
      console.log(`  DEBUG url after click: ${url}`);

      if (url.includes('/app/meetings/') && url !== MEETINGS_URL && url !== MEETINGS_URL + '/') {
        const meetingId = url.split('/').pop();
        meetingUrls.push({ url, id: meetingId, title });
        console.log(`[${i + 1}/${total}] Found: ${meetingId} - ${title}`);
      } else {
        console.log(`[${i + 1}/${total}] SKIP (no meeting URL): ${title}`);
      }

      // Go back to list
      await page.goBack({ waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(2000);

    } catch (err) {
      console.log(`[${i + 1}/${total}] ERROR collecting: ${err.message}`);
      // Try to recover by going back to meetings list
      await page.goto(MEETINGS_URL, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => null);
      await page.waitForTimeout(5000);
    }
  }

  console.log(`\n[COLLECT] Collected ${meetingUrls.length} meeting URLs.\n`);

  // Save URL list for resume capability
  const urlsFile = path.join(__dirname, 'transcripts', '_urls.json');
  fs.writeFileSync(urlsFile, JSON.stringify(meetingUrls, null, 2), 'utf-8');

  return meetingUrls;
}

async function scrapeTranscript(page, meeting, index, total) {
  const { url, id, title } = meeting;

  // Build filename from meeting title (sanitized)
  const safeName = (title || id)
    .replace(/[\/\\:*?"<>|]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100);
  const fileName = `${safeName}.md`;
  const outputFile = path.join(OUTPUT_DIR, fileName);

  // Skip if already scraped (check both by name and by id)
  const legacyFile = path.join(OUTPUT_DIR, `${id}.md`);
  if (fs.existsSync(outputFile) || fs.existsSync(legacyFile)) {
    console.log(`[${index}/${total}] SKIP ${safeName} (already exists)`);
    return { id, title, fileName, status: 'skipped' };
  }

  console.log(`[${index}/${total}] Scraping: ${title}...`);

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(5000);

    // Click "Transcrição" tab in the right panel
    const transcriptTab = page.locator('[data-testid="active-tabButton"]', { hasText: 'Transcrição' })
      .or(page.locator('button', { hasText: 'Transcrição' }));
    await transcriptTab.first().click().catch(() => null);
    await page.waitForTimeout(3000);

    // Extract transcript from the player container (children[1] has the transcript text)
    const content = await page.evaluate(() => {
      const el = document.querySelector('[data-player-type]');
      if (!el) return '';
      // children[1] contains the transcript lines (speakers + text)
      const transcriptArea = el.children[1] || el;
      return transcriptArea.innerText || '';
    });

    if (!content || content.length < 100) {
      console.log(`[${index}/${total}] WARNING: Short content (${content?.length || 0} chars)`);
      return { id, title, status: 'empty' };
    }

    // Extract title from page
    const pageTitle = await page.title();

    // Format as markdown
    const markdown = `# ${pageTitle}\n\n**Source:** ${url}\n**Scraped:** ${new Date().toISOString()}\n\n---\n\n${content}`;

    fs.writeFileSync(outputFile, markdown, 'utf-8');
    console.log(`[${index}/${total}] OK (${content.length} chars) -> ${fileName}`);
    return { id, title, fileName, status: 'ok', chars: content.length };

  } catch (err) {
    console.error(`[${index}/${total}] ERROR: ${err.message}`);
    return { id, title, status: 'error', error: err.message };
  }
}

async function scrape() {
  if (!fs.existsSync(AUTH_FILE)) {
    console.error('[ERROR] No saved session. Run without --scrape first to login.');
    process.exit(1);
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.mkdirSync(path.join(__dirname, 'transcripts'), { recursive: true });

  const visible = args.includes('--visible');
  const browser = await chromium.launch({ headless: !visible });
  const context = await browser.newContext({ storageState: AUTH_FILE });
  const page = await context.newPage();

  // Check if we have a saved URL list (resume capability)
  const urlsFile = path.join(__dirname, 'transcripts', '_urls.json');
  let meetings;

  if (fs.existsSync(urlsFile)) {
    meetings = JSON.parse(fs.readFileSync(urlsFile, 'utf-8'));
    console.log(`[RESUME] Found saved URL list with ${meetings.length} meetings.\n`);
  } else {
    // Phase 1: Load all meetings and collect URLs
    const cardCount = await loadAllMeetings(page, limit);
    meetings = await collectMeetingUrlsByClicking(page, cardCount, limit);
  }

  const toScrape = meetings.slice(0, limit);

  // Phase 2: Scrape each meeting transcript
  console.log(`[SCRAPE] Scraping ${toScrape.length} meetings...\n`);
  const results = [];

  for (let i = 0; i < toScrape.length; i++) {
    const result = await scrapeTranscript(page, toScrape[i], i + 1, toScrape.length);
    results.push(result);

    // Small delay between requests
    if (i < toScrape.length - 1) {
      await page.waitForTimeout(1000);
    }
  }

  // Summary
  const ok = results.filter(r => r.status === 'ok').length;
  const skipped = results.filter(r => r.status === 'skipped').length;
  const empty = results.filter(r => r.status === 'empty').length;
  const errors = results.filter(r => r.status === 'error').length;

  console.log('\n--- SUMMARY ---');
  console.log(`Total: ${results.length} | OK: ${ok} | Skipped: ${skipped} | Empty: ${empty} | Errors: ${errors}`);
  console.log(`Output: ${OUTPUT_DIR}/`);

  // Save index
  const indexFile = path.join(__dirname, 'transcripts', '_index.json');
  fs.writeFileSync(indexFile, JSON.stringify(results, null, 2), 'utf-8');
  console.log(`Index: ${indexFile}`);

  await browser.close();
}

// Main
(async () => {
  try {
    if (shouldScrape) {
      await scrape();
    } else {
      await login();
    }
  } catch (err) {
    console.error('[FATAL]', err.message);
    process.exit(1);
  }
})();
