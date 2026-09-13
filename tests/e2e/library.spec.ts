import {test, expect, type Page} from '@playwright/test';
import {writeFile} from 'node:fs/promises';

async function openSearch(page: Page) {
  if (await page.getByRole('textbox',{name:/^(Search|搜索)$/,exact:true}).isVisible()) return;
  const summary=page.locator('header summary');
  if (await summary.count()) {
    if (await page.locator('header details').getAttribute('open') === null) await summary.click();
  } else if (!await page.getByRole('dialog').isVisible()) {
    await page.locator('header').getByRole('button',{name:/^(Search|搜索)$/}).click();
  }
}
async function closeSearch(page: Page) {
  if (await page.getByRole('dialog').isVisible()) await page.getByRole('button',{name:/^(Close|关闭)$/}).click();
  else if (await page.locator('header summary').count() && await page.locator('header details').getAttribute('open') !== null) await page.locator('header summary').click();
}


test('SSR serves real localized content, normalized queries and correct 404s', async ({request}) => {
  const response = await request.get('/zh/exercises?equipment=barbell');
  expect(response.status()).toBe(200);
  const html = await response.text();
  expect(html).toContain('动作浏览');
  expect(html).toContain('data-testid="exercise-card"');
  expect(html).not.toContain('instructions_fr');
  expect((await request.get('/zh/exercises/9999')).status()).toBe(404);
  expect((await request.get('/zh/exercises/0001')).status()).toBe(200);
  expect((await request.get('/xx/exercises')).status()).toBe(404);
  const invalid = await request.get('/zh/exercises?page=-1&sort=bad&unknown=1', {maxRedirects:0});
  expect([307,308]).toContain(invalid.status());
  expect(invalid.headers().location).toBe('/zh/exercises');
  expect((await request.get('/zh/setup')).status()).toBe(404);
  expect((await request.get('/setup.html')).status()).toBe(404);
  expect((await request.get('/index.html')).status()).toBe(404);
});

test('search, filtering, pagination, detail and language preserve URL state', async ({page}) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/en/exercises');
  await expect(page.getByTestId('exercise-card')).toHaveCount(24);
  await openSearch(page);
  await page.getByLabel('Search', {exact:true}).fill('press');
  await expect(page).toHaveURL(/q=press/);
  await page.getByRole('group',{name:'Equipment',exact:true}).getByRole('link',{name:/^barbell$/i}).click();
  await expect(page).toHaveURL(/equipment=barbell/);
  await expect(page.getByTestId('exercise-card').first()).toContainText(/press/i);
  await closeSearch(page);
  const first = page.getByTestId('exercise-card').first().getByRole('button',{name:/press/i});
  await first.focus();
  await first.press('Enter');
  await expect(page).toHaveURL(/\/en\/exercises\?q=press&equipment=barbell$/);
  await expect(page.getByRole('heading',{name:'How to perform'})).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(first).toBeFocused();
  await page.getByRole('combobox',{name:'Language'}).click();
  await page.getByRole('option',{name:'简体中文'}).click();
  await expect(page).toHaveURL(/\/zh\/exercises\?q=press&equipment=barbell$/);
  await expect(page.locator('html')).toHaveAttribute('lang','zh');
  const translatedCard = page.getByTestId('exercise-card').first();
  const translatedName = (await translatedCard.getByRole('heading').textContent())!;
  await translatedCard.getByRole('button',{name:translatedName,exact:true}).click({position:{x:4,y:4}});
  await expect(page.getByRole('dialog').locator('ol')).toHaveAttribute('lang','zh');
  await page.getByRole('button',{name:'关闭',exact:true}).click();
  await expect(page).toHaveURL(/\/zh\/exercises\?q=press&equipment=barbell/);
  await page.reload();
  await openSearch(page);
  await expect(page.getByLabel('搜索',{exact:true})).toHaveValue('press');
  await page.getByRole('link',{name:'清除全部'}).first().click();
  await closeSearch(page);
  await page.getByRole('link',{name:'下一页'}).click();
  await expect(page).toHaveURL(/page=2/);
  await page.goBack();
  await expect(page).toHaveURL(/\/zh\/exercises$/);
  expect(errors).toEqual([]);
});

test('native GET form and pagination work without JavaScript', async ({browser}) => {
  const context = await browser.newContext({javaScriptEnabled:false});
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:3000/en/exercises');
  await expect(page.getByTestId('exercise-card')).toHaveCount(24);
  await openSearch(page);
  await page.getByRole('textbox',{name:'Search',exact:true}).fill('row');
  await page.getByRole('textbox',{name:'Search',exact:true}).press('Enter');
  await expect(page).toHaveURL(/q=row/);
  await expect(page.getByTestId('exercise-card').first()).toContainText(/row/i);
  await page.getByRole('link',{name:'Next',exact:true}).click();
  await expect(page).toHaveURL(/page=2/);
  await context.close();
});

test('theme tokens remain valid and preference survives refresh', async ({page}) => {
  await page.goto('/en/exercises');
  await page.getByRole('combobox',{name:'Appearance'}).click();
  await page.getByRole('option',{name:'Dark',exact:true}).click();
  await expect(page.locator('html')).toHaveClass(/dark/);
  const colors = await page.evaluate(() => {
    const style = getComputedStyle(document.documentElement);
    return Object.fromEntries(['--card-foreground','--accent','--accent-foreground','--sidebar-primary','--sidebar-ring'].map(key=>[key,style.getPropertyValue(key).trim()]));
  });
  for (const value of Object.values(colors)) expect(value).not.toBe('');
  await page.reload();
  await expect(page.locator('html')).toHaveClass(/dark/);
  await page.screenshot({path:'test-results/library-dark.png',fullPage:true});
});

test('mobile tags apply and cancel immediately without an apply button', async ({page}) => {
  await page.setViewportSize({width:360,height:800});
  await page.goto('/zh/exercises');
  await openSearch(page);
  const equipment = page.getByRole('group',{name:'训练器械',exact:true});
  const dumbbell = equipment.getByRole('link',{name:'哑铃',exact:true});
  await dumbbell.click();
  await expect(page).toHaveURL(/equipment=dumbbell/);
  await expect(dumbbell).toHaveAttribute('aria-current','true');
  await expect(page.getByRole('button',{name:'应用筛选'})).toHaveCount(0);
  await dumbbell.click();
  await expect(page).toHaveURL(/\/zh\/exercises$/);
  await expect(dumbbell).not.toHaveAttribute('aria-current','true');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({path:'test-results/library-mobile.png',fullPage:true});
});

test('SQL download works', async ({request}) => {
  const response = await request.get('/api/exports/sql?db=sqlite');
  expect(response.headers()['content-disposition']).toContain('exercises-sqlite.sql');
  const sql = await response.text();
  expect(sql.match(/INSERT INTO exercises/g)).toHaveLength(1324);
  expect(sql).toContain('instructions_fr');
  expect((await request.get('/api/exports/sql?db=invalid')).status()).toBe(400);
});

test('first load does not fetch the dataset or animations', async ({page}) => {
  const urls: string[] = []; page.on('request',request=>urls.push(request.url()));
  await page.goto('/en/exercises');
  await expect(page.getByTestId('exercise-card')).toHaveCount(24);
  expect(urls.some(url=>url.includes('/data/exercises.json'))).toBe(false);
  expect(urls.some(url=>url.endsWith('.gif'))).toBe(false);
  const metrics = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    return {ttfbMs: nav.responseStart - nav.requestStart, htmlEncodedBytes: nav.encodedBodySize, jsEncodedBytes: resources.filter(r=>r.initiatorType==='script').reduce((sum,r)=>sum+r.encodedBodySize,0), imageRequests: resources.filter(r=>r.initiatorType==='img').length};
  });
  await writeFile('test-results/performance.json',JSON.stringify(metrics,null,2));
  expect(metrics.htmlEncodedBytes).toBeLessThan(250_000);
  expect(metrics.jsEncodedBytes).toBeLessThan(200_000);
  await page.screenshot({path:'test-results/library-desktop.png',fullPage:true});
});


test('mobile native search remains available without JavaScript', async ({browser}) => {
  const context = await browser.newContext({javaScriptEnabled:false,viewport:{width:360,height:800}});
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:3000/zh/exercises');
  await openSearch(page);
  await page.getByRole('textbox',{name:'搜索',exact:true}).fill('row');
  await page.getByRole('textbox',{name:'搜索',exact:true}).press('Enter');
  await expect(page).toHaveURL(/q=row/);
  await expect(page.getByTestId('exercise-card').first()).toContainText(/row/i);
  await context.close();
});


test('all ten locales open localized instructions in a drawer', async ({page}) => {
  const locales = ['en','es','it','tr','ru','zh','hi','pl','ko','fr'];
  for (const locale of locales) {
    await page.goto(`/${locale}/exercises`);
    await expect(page.locator('html')).toHaveAttribute('lang',locale);
    const card = page.getByTestId('exercise-card').first();
    const name = (await card.getByRole('heading').textContent())!;
    await expect(card.getByRole('heading')).toHaveAttribute('lang',locale);
    await card.getByRole('button',{name,exact:true}).click({position:{x:4,y:4}});
    await expect(page.getByRole('dialog').getByRole('heading',{level:1})).toHaveText(name);
    await expect(page.getByRole('dialog').locator('ol')).toHaveAttribute('lang',locale);
    await expect(page).toHaveURL(new RegExp(`/${locale}/exercises$`));
  }
});


test('a delayed search response cannot overwrite a newer draft', async ({page}) => {
  await page.goto('/en/exercises');
  await page.route('**/en/exercises?**', async route => {
    if (new URL(route.request().url()).searchParams.get('q') === 'pre') await new Promise(resolve => setTimeout(resolve,150));
    await route.continue();
  });
  const firstRequest = page.waitForRequest(request => new URL(request.url()).searchParams.get('q') === 'pre');
  await openSearch(page);
  await page.getByRole('textbox',{name:'Search',exact:true}).fill('pre');
  await firstRequest;
  await page.getByRole('textbox',{name:'Search',exact:true}).fill('press');
  await expect(page).toHaveURL(/q=press(?:&|$)/);
  await expect(page.getByRole('textbox',{name:'Search',exact:true})).toHaveValue('press');
});

test('media preview and card navigation have separate pointer and keyboard targets', async ({browser}) => {
  for (const mobile of [false, true]) {
    const context = await browser.newContext({
      viewport: mobile ? {width:360,height:800} : {width:1280,height:900},
      hasTouch: mobile, isMobile: mobile, reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    const listUrl = 'http://127.0.0.1:3000/zh/exercises?equipment=barbell';
    await page.goto(listUrl);
    const card = page.getByTestId('exercise-card').first();
    const media = card.getByRole('button',{name:/播放|暂停/});
    const image = card.locator('img');
    if (mobile) await image.tap(); else await image.click();
    await expect(image).toHaveAttribute('src', /\.gif$/);
    await expect(page).toHaveURL(listUrl);
    await media.click();
    await expect(image).toHaveAttribute('src', /\.(jpg|jpeg|png)$/);
    await media.focus();
    await page.keyboard.press('Enter');
    await expect(image).toHaveAttribute('src', /\.gif$/);
    await expect(page).toHaveURL(listUrl);
    await card.getByRole('heading').scrollIntoViewIfNeeded();
    const title = await card.getByRole('heading').boundingBox();
    expect(title).not.toBeNull();
    await page.mouse.click(title!.x + 8, title!.y + 8);
    if (mobile) {
      await expect(page).toHaveURL(/\/zh\/exercises\/\d+$/);
      await expect(page.getByRole('heading',{level:1})).toBeVisible();
      await expect(page.getByRole('dialog')).not.toBeVisible();
    } else {
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page).toHaveURL(listUrl);
    }
    await context.close();
  }
});


test('tag links preserve search, accumulate selections, reset pagination and work without JS', async ({browser}) => {
  for (const javaScriptEnabled of [true,false]) {
    const context=await browser.newContext({javaScriptEnabled});
    const page=await context.newPage();
    await page.goto('http://127.0.0.1:3000/en/exercises?q=press&page=2');
    await openSearch(page);
    const equipment=page.getByRole('group',{name:'Equipment',exact:true});
    await equipment.getByRole('link',{name:/^barbell$/i}).click();
    await expect(page).toHaveURL(/q=press&equipment=barbell$/);
    await openSearch(page);
    await equipment.getByRole('link',{name:/^dumbbell$/i}).click();
    await expect(page).toHaveURL(/q=press&equipment=barbell&equipment=dumbbell$/);
    await openSearch(page);
    await page.getByRole('group',{name:'Sort by',exact:true}).getByRole('link',{name:'Name: Z–A',exact:true}).click();
    await expect(page).toHaveURL(/sort=name-desc/);
    await page.goBack();
    await expect(page).toHaveURL(/q=press&equipment=barbell&equipment=dumbbell$/);
    await context.close();
  }
});


test('header shows branding and the library omits the duplicate title', async ({page}) => {
  await page.goto('/zh/exercises');
  await expect(page.locator('header').getByRole('link',{name:'动作库',exact:true})).toBeVisible();
  await expect(page.locator('main').getByRole('heading',{name:'动作浏览',exact:true})).toHaveCount(0);
});
