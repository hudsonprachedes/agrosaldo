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
    title: 'AgroSaldo | Plataforma de Gestão Pecuária e Compliance Sanitário',
    description:
      'Controle nascimentos, vendas, GTA e indicadores do rebanho em tempo real com o AgroSaldo. Operação offline-first, relatórios oficiais e conformidade automática com INDEA, IAGRO e demais órgãos.',
    keywords:
      'gestão pecuária, controle de rebanho, GTA digital, aplicativo agro offline, compliance sanitário, INDEA, IAGRO, software rural',
    image: 'https://agrosaldo.com/og-image.png',
    ogImage: 'https://agrosaldo.com/og-image.png',
    author: 'AgroSaldo Tecnologia Rural',
    url: 'https://agrosaldo.com/',
    type: 'website',
  },
  blog: {
    title: 'Blog AgroSaldo | Conteúdos sobre Gestão Pecuária Inteligente',
    description:
      'Artigos, tutoriais e guias práticos sobre controle de rebanho, compliance sanitário, evolução automática e tecnologia para o campo.',
    keywords: 'blog pecuária, dicas de gestão rural, compliance agro, tutoriais AgroSaldo',
    type: 'article',
    url: 'https://agrosaldo.com/blog',
    image: 'https://agrosaldo.com/og-image.png',
  },
  contact: {
    title: 'Contato AgroSaldo | Suporte especializado via WhatsApp e E-mail',
    description:
      'Fale com especialistas do AgroSaldo para tirar dúvidas sobre o app, planos, implantação assistida e suporte ao produtor.',
    keywords: 'contato AgroSaldo, suporte pecuária, WhatsApp AgroSaldo, atendimento produtor rural',
    url: 'https://agrosaldo.com/contato',
    image: 'https://agrosaldo.com/og-image.png',
    type: 'website',
  },
  login: {
    title: 'Login | Acesse sua conta AgroSaldo',
    description: 'Entre no painel AgroSaldo para acompanhar estoque oficial, indicadores e lançar eventos.',
    url: 'https://agrosaldo.com/login',
  },
  app: {
    title: 'Dashboard AgroSaldo | Indicadores em tempo real',
    description: 'Painel completo para controlar lotes, evoluções e documentação do rebanho em qualquer dispositivo.',
    url: 'https://agrosaldo.com/dashboard',
  },
} as const;

/**
 * Gera Schema.org estruturado em JSON-LD
 * Melhora SEO e aparência em resultados de busca
 */
export function generateJsonLd(data: Record<string, unknown>, id?: string) {
  if (typeof document === 'undefined') return;

  if (id) {
    const existing = document.querySelector<HTMLScriptElement>(`script[data-json-ld-id="${id}"]`);
    if (existing) {
      existing.remove();
    }
  }

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  if (id) {
    script.dataset.jsonLdId = id;
  }
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

export function getFaqPageSchema(
  faqs: { question: string; answer: string }[],
  options?: { url?: string; name?: string }
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    name: options?.name || 'Perguntas frequentes AgroSaldo',
    url: options?.url || 'https://agrosaldo.com/',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

export function getBlogCollectionSchema(posts: { title: string; description: string; date: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Blog AgroSaldo',
    url: 'https://agrosaldo.com/blog',
    description:
      'Conteúdos sobre gestão pecuária inteligente, compliance sanitário e automação para produtores rurais.',
    mainEntity: posts.map(post => ({
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.description,
      datePublished: new Date(post.date).toISOString(),
      url: post.url,
    })),
  };
}

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
