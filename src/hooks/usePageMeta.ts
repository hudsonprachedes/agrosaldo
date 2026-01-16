import { useEffect } from 'react';
import { generateJsonLd, MetaTags, PAGE_META_TAGS, setMetaTags } from '@/lib/seo';

type PageKey = keyof typeof PAGE_META_TAGS;

type StructuredDataEntry = {
  id?: string;
  data: Record<string, unknown>;
};

interface UsePageMetaOptions {
  page: PageKey;
  overrides?: Partial<MetaTags>;
  structuredData?: StructuredDataEntry | StructuredDataEntry[];
}

export function usePageMeta({ page, overrides, structuredData }: UsePageMetaOptions) {
  useEffect(() => {
    const baseTags = PAGE_META_TAGS[page];
    if (!baseTags) return;

    setMetaTags({ ...baseTags, ...overrides });

    const entries = structuredData ? (Array.isArray(structuredData) ? structuredData : [structuredData]) : [];
    const scriptIds: string[] = [];

    entries.forEach((entry, index) => {
      if (!entry?.data) return;

      const id = entry.id ?? `${page}-schema-${index}`;
      scriptIds.push(id);
      generateJsonLd(entry.data, id);
    });

    return () => {
      if (typeof document === 'undefined') return;

      scriptIds.forEach(id => {
        const script = document.querySelector<HTMLScriptElement>(`script[data-json-ld-id="${id}"]`);
        script?.remove();
      });
    };
  }, [page, overrides, structuredData]);
}

export default usePageMeta;
