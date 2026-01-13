/**
 * Gerador de Sitemap.xml para SEO
 * Ajuda Google a indexar todas as páginas importantes
 */

interface SitemapEntry {
  url: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

const SITE_URL = 'https://agrosaldo.com';

/**
 * Páginas estáticas principais
 */
const staticPages: SitemapEntry[] = [
  {
    url: `${SITE_URL}/`,
    changefreq: 'monthly',
    priority: 1.0,
  },
  {
    url: `${SITE_URL}/blog`,
    changefreq: 'weekly',
    priority: 0.8,
  },
  {
    url: `${SITE_URL}/contato`,
    changefreq: 'monthly',
    priority: 0.7,
  },
  {
    url: `${SITE_URL}/login`,
    changefreq: 'monthly',
    priority: 0.6,
  },
];

/**
 * Posts de blog (gerados dinamicamente)
 */
const blogPosts: SitemapEntry[] = [
  {
    url: `${SITE_URL}/blog/registrar-nascimentos-offline`,
    changefreq: 'never',
    priority: 0.7,
    lastmod: '2024-01-15',
  },
  {
    url: `${SITE_URL}/blog/gta-eletronica-ms-mt`,
    changefreq: 'never',
    priority: 0.7,
    lastmod: '2024-01-10',
  },
  {
    url: `${SITE_URL}/blog/reduzir-mortalidade-dicas`,
    changefreq: 'never',
    priority: 0.7,
    lastmod: '2024-01-05',
  },
  {
    url: `${SITE_URL}/blog/sincronizacao-offline`,
    changefreq: 'never',
    priority: 0.7,
    lastmod: '2023-12-28',
  },
  {
    url: `${SITE_URL}/blog/evolucao-faixas-etarias`,
    changefreq: 'never',
    priority: 0.7,
    lastmod: '2023-12-20',
  },
  {
    url: `${SITE_URL}/blog/relatorio-pdf-declaracao`,
    changefreq: 'never',
    priority: 0.7,
    lastmod: '2023-12-15',
  },
  {
    url: `${SITE_URL}/blog/multi-tenant-propriedades`,
    changefreq: 'never',
    priority: 0.7,
    lastmod: '2023-12-10',
  },
  {
    url: `${SITE_URL}/blog/migracao-planilha`,
    changefreq: 'never',
    priority: 0.7,
    lastmod: '2023-12-05',
  },
];

/**
 * Gera XML do Sitemap
 */
export function generateSitemapXml(entries: SitemapEntry[] = [...staticPages, ...blogPosts]): string {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (entry) => `
  <url>
    <loc>${escapeXml(entry.url)}</loc>
    ${entry.lastmod ? `<lastmod>${entry.lastmod}</lastmod>` : ''}
    ${entry.changefreq ? `<changefreq>${entry.changefreq}</changefreq>` : ''}
    ${entry.priority ? `<priority>${entry.priority}</priority>` : ''}
  </url>`
  )
  .join('')}
</urlset>`;

  return xml;
}

/**
 * Gera índice de sitemaps (para sites muito grandes)
 */
export function generateSitemapIndexXml(sitemapUrls: string[]): string {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls
  .map(
    (url) => `
  <sitemap>
    <loc>${escapeXml(url)}</loc>
  </sitemap>`
  )
  .join('')}
</sitemapindex>`;

  return xml;
}

/**
 * Escapa caracteres especiais para XML
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Gera robots.txt
 */
export function generateRobotsTxt(): string {
  return `# AgroSaldo Robots.txt
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /dashboard/
Disallow: /private/
Disallow: /*.json$
Disallow: /*.php$

# Crawl delay (segundos entre requisições)
Crawl-delay: 2

# User-agents específicos
User-agent: AdsBot-Google
Allow: /

User-agent: Googlebot
Allow: /

# Sitemaps
Sitemap: ${SITE_URL}/sitemap.xml
Sitemap: ${SITE_URL}/blog-sitemap.xml

# Cache control
User-agent: *
Cache-Control: no-cache

# Específico para buscadores brasileiros
User-agent: Baidu
Disallow: /

User-agent: Yandex
Disallow: /
`;
}

/**
 * Gera arquivo de configuração Next.js para sitemap dinâmico
 * Usar em API route: /api/sitemap.xml
 */
export async function handleSitemapRequest(
  req: Request
): Promise<Response> {
  const sitemap = generateSitemapXml();

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600', // Cache por 1 hora
    },
  });
}

/**
 * Gera arquivo para robots.txt
 * Usar em API route: /api/robots.txt
 */
export async function handleRobotsRequest(
  req: Request
): Promise<Response> {
  const robots = generateRobotsTxt();

  return new Response(robots, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400', // Cache por 24 horas
    },
  });
}

/**
 * Retorna URL do sitemap para header <link>
 */
export function getSitemapUrl(): string {
  return `${SITE_URL}/sitemap.xml`;
}

/**
 * Schema de breadcrumb para SEO
 */
export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Schema FAQPage para perguntas frequentes
 */
export function generateFaqSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}
