import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const origin = site ?? new URL('https://haicuotu.pages.dev');
  const sitemapUrl = new URL('/sitemap-index.xml', origin).toString();

  return new Response(
    [
      'User-agent: *',
      'Allow: /',
      '',
      `Sitemap: ${sitemapUrl}`,
      ''
    ].join('\n'),
    {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8'
      }
    }
  );
};
