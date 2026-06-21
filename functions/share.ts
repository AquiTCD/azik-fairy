/**
 * Cloudflare Pages Functions: /share — OGP relay endpoint
 *
 * Crawlers receive OGP <meta> tags pointing to ogig image API.
 * Human browsers are immediately redirected to the game root.
 *
 * Query params (from game): theme, title, wpm, acc, azik, rank, comment, training
 * Env vars: OGIG_URL
 */

interface Env {
  OGIG_URL?: string;
}

const BOT_PATTERN = /Twitterbot|facebookexternalhit|LinkedInBot|Discordbot|TelegramBot|Slackbot|WhatsApp|bot|crawler|spider/i;

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const { searchParams } = url;

  const theme    = searchParams.get('theme')    || 'af';
  const title    = searchParams.get('title')    || '';
  const wpm      = searchParams.get('wpm')      || '';
  const acc      = searchParams.get('acc')      || '';
  const azik     = searchParams.get('azik')     || '';
  const rank     = searchParams.get('rank')     || '';
  const training = searchParams.get('training') || '';

  const ogigBase = context.env.OGIG_URL || 'https://ogig.solunita.net';
  const ogImageUrl = new URL(`${ogigBase}/api/og`);
  ogImageUrl.searchParams.set('theme', theme);
  if (title)    ogImageUrl.searchParams.set('title',    title);
  if (wpm)      ogImageUrl.searchParams.set('wpm',      wpm);
  if (acc)      ogImageUrl.searchParams.set('acc',      acc);
  if (azik)     ogImageUrl.searchParams.set('azik',     azik);
  if (rank)     ogImageUrl.searchParams.set('rank',     rank);
  if (training) ogImageUrl.searchParams.set('training', training);

  const userAgent = context.request.headers.get('User-Agent') || '';
  const isCrawler = BOT_PATTERN.test(userAgent);

  if (!isCrawler) {
    return Response.redirect(`${url.origin}/`, 302);
  }

  const safeTitle = escapeHtml(title);
  const isTraining = training === 'true';

  const pageTitle = isTraining
    ? 'AZIKトレーニング中 | AZIK-Fairy'
    : safeTitle
    ? `${safeTitle} チャレンジ！ | AZIK-Fairy`
    : 'AZIK-Fairy | AZIKタイピング養成妖精';

  const description = isTraining
    ? 'AZIKタイピング特訓中！'
    : [
        rank && `Rank: ${escapeHtml(rank)}`,
        wpm  && `WPM: ${escapeHtml(wpm)}`,
        acc  && `Acc: ${escapeHtml(acc)}%`,
        azik && `AZIK: ${escapeHtml(azik)}%`,
      ]
        .filter(Boolean)
        .join(' | ') || 'AZIK入力をゲーム感覚で楽しく、強制モードでスパルタに養成してくれるタイピングゲーム';

  const ogImage  = escapeHtml(ogImageUrl.toString());
  const pageUrl  = escapeHtml(url.toString());

  const html = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>${pageTitle}</title>
  <meta name="description" content="${description}">
  <meta name="robots" content="noindex, nofollow">
  <meta property="og:url" content="${pageUrl}">
  <meta property="og:title" content="${pageTitle}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${ogImage}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="AZIK-Fairy">
  <meta property="og:locale" content="ja_JP">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${pageTitle}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${ogImage}">
  <script>window.location.replace('/');</script>
</head>
<body></body>
</html>`;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html;charset=UTF-8',
      'Cache-Control': 'no-store',
    },
  });
};
