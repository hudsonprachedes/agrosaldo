/**
 * Utilitários para SEO e Meta Tags
 * Garante que cada página tenha metadados corretos para Google e redes sociais
 */
import { useEffect } from 'react';

export interface MetaTags {
  title: string;
  description: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  author?: string;
  ogImage?: string;
  twitterCard?: 'summary' | 'summary_large_image';
}

/**
 * Define meta tags da página
 */
export function setMetaTags(tags: MetaTags) {
  // Title
  document.title = tags.title;
  updateOrCreateMetaTag('meta', 'property', 'og:title', tags.title);

  // Description
  updateOrCreateMetaTag('meta', 'name', 'description', tags.description);
  updateOrCreateMetaTag('meta', 'property', 'og:description', tags.description);
  updateOrCreateMetaTag('meta', 'name', 'twitter:description', tags.description);

  // Keywords
  if (tags.keywords) {
    updateOrCreateMetaTag('meta', 'name', 'keywords', tags.keywords);
  }

  // Image
  if (tags.image || tags.ogImage) {
    const imageUrl = tags.ogImage || tags.image;
    updateOrCreateMetaTag('meta', 'property', 'og:image', imageUrl);
    updateOrCreateMetaTag('meta', 'name', 'twitter:image', imageUrl);
  }

  // URL
  if (tags.url) {
    updateOrCreateMetaTag('meta', 'property', 'og:url', tags.url);
    updateOrCreateMetaTag('link', 'rel', 'canonical', tags.url);
  }

  // Type
  if (tags.type) {
    updateOrCreateMetaTag('meta', 'property', 'og:type', tags.type);
  }

  // Author
  if (tags.author) {
    updateOrCreateMetaTag('meta', 'name', 'author', tags.author);
    updateOrCreateMetaTag('meta', 'property', 'article:author', tags.author);
  }

  // Twitter Card
  const twitterCard = tags.twitterCard || 'summary_large_image';
  updateOrCreateMetaTag('meta', 'name', 'twitter:card', twitterCard);
}

/**
 * Atualiza ou cria meta tag
 */
function updateOrCreateMetaTag(
  tagName: 'meta' | 'link',
  attrName: 'name' | 'property' | 'rel',
  attrValue: string,
  content: string
) {
  let element = document.querySelector(`${tagName}[${attrName}="${attrValue}"]`);

  if (!element) {
    element = document.createElement(tagName);
    element.setAttribute(attrName, attrValue);
    document.head.appendChild(element);
  }

  if (tagName === 'meta' && content) {
    (element as HTMLMetaElement).setAttribute('content', content);
  } else if (tagName === 'link' && content) {
    (element as HTMLLinkElement).setAttribute('href', content);
  }
}

/**
 * Meta tags padrão para cada página
 */
export const PAGE_META_TAGS = {
  home: {
    title: 'AgroSaldo - Gestão Pecuária Inteligente',
    description:
      'O AgroSaldo é o sistema de gestão pecuária que garante que seu saldo físico bata com o oficial. Offline-first, mobile-first e compliance garantida.',
    keywords: 'gestão pecuária, controle rebanho, GTA, INDEA, IAGRO, app rural',
    image: 'https://agrosaldo.com/og-image.png',
    author: 'AgroSaldo',
  },
  blog: {
    title: 'Blog AgroSaldo - Dicas de Gestão Pecuária',
    description:
      'Leia artigos sobre gestão pecuária, dicas de compliance sanitária e tutoriais para usar o AgroSaldo.',
    keywords: 'blog pecuária, gestão rebanho, compliance, tutorial AgroSaldo',
    type: 'article',
  },
  contact: {
    title: 'Contato - AgroSaldo',
    description: 'Entre em contato conosco para dúvidas sobre o AgroSaldo. Suporte via WhatsApp.',
    keywords: 'contato, suporte AgroSaldo, WhatsApp',
  },
  login: {
    title: 'Login - AgroSaldo',
    description: 'Acesse sua conta do AgroSaldo para gerenciar sua propriedade.',
  },
  app: {
    title: 'Dashboard - AgroSaldo',
    description: 'Seu dashboard de gestão pecuária com controle em tempo real.',
  },
} as const;

/**
 * Gera Schema.org estruturado em JSON-LD
 * Melhora SEO e aparência em resultados de busca
 */
export function generateJsonLd(data: Record<string, unknown>) {
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.innerHTML = JSON.stringify(data);
  document.head.appendChild(script);
}

/**
 * Schema para Organização
 */
export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'AgroSaldo',
  url: 'https://agrosaldo.com',
  logo: 'https://agrosaldo.com/logo.png',
  description: 'Plataforma de gestão pecuária inteligente e offline-first',
  sameAs: [
    'https://facebook.com/agrosaldo',
    'https://instagram.com/agrosaldo',
    'https://linkedin.com/company/agrosaldo',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'Customer Support',
    telephone: '+55-67-9-9999-9999',
    email: 'suporte@agrosaldo.com',
    areaServed: 'BR',
    availableLanguage: 'pt-BR',
  },
};

/**
 * Schema para SoftwareApplication (App)
 */
export function getSoftwareApplicationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'AgroSaldo',
    description: 'Gestão pecuária inteligente para o produtor rural brasileiro',
    url: 'https://agrosaldo.com',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web, iOS, Android',
    offers: {
      '@type': 'Offer',
      price: '29.90',
      priceCurrency: 'BRL',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '500',
    },
  };
}

/**
 * Schema para BlogPosting
 */
export function getBlogPostingSchema(post: {
  title: string;
  description: string;
  author: string;
  date: string;
  image?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    author: {
      '@type': 'Person',
      name: post.author,
    },
    datePublished: new Date(post.date).toISOString(),
    image: post.image || 'https://agrosaldo.com/og-image.png',
    url: `https://agrosaldo.com/blog/${post.title.toLowerCase().replace(/\s+/g, '-')}`,
  };
}

/**
 * Schema para LocalBusiness (para encontrabilidade local)
 */
export const localBusinessSchema = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: 'AgroSaldo',
  image: 'https://agrosaldo.com/logo.png',
  description: 'Plataforma de gestão pecuária',
  url: 'https://agrosaldo.com',
  telephone: '+55-67-9-9999-9999',
  address: {
    '@type': 'PostalAddress',
    addressCountry: 'BR',
    addressRegion: 'MS',
    streetAddress: 'Rua Exemplo, 123',
    addressLocality: 'Campo Grande',
    postalCode: '79000-000',
  },
};

/**
 * Hook para usar em componentes de página
 * Exemplo:
 * usePageMeta(PAGE_META_TAGS.home)
 */
export const usePageMeta = (tags: (typeof PAGE_META_TAGS)[keyof typeof PAGE_META_TAGS]): void => {
  useEffect(() => {
    setMetaTags(tags as MetaTags);
  }, [tags]);
};
