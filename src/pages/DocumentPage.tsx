import { useEffect, useRef, useState } from 'react';
import { useRoute, useSearch } from 'wouter';
import { Header } from '@/components/Header';
import { MarkdownContent } from '@/components/MarkdownContent';

interface DocData {
  content: string;
  lastModified: string;
}

export function DocumentPage() {
  const [, params] = useRoute('/:document');
  const search = useSearch();
  const slug = params?.document ?? '';
  const langParam = new URLSearchParams(search || '').get('lang');
  const lastFetched = useRef<string | null>(null);

  const [data, setData] = useState<DocData | null>(null);
  const [languages, setLanguages] = useState<string[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!slug) return;
    const cacheKey = `${slug}:${langParam ?? ''}`;
    if (lastFetched.current === cacheKey) return;
    lastFetched.current = cacheKey;

    fetch('/api/documents')
      .then((r) => r.json())
      .then((docs: { slug: string; languages: string[] }[]) => {
        const doc = docs.find((d) => d.slug === slug);
        if (!doc || doc.languages.length === 0) {
          setError(true);
          return;
        }
        setLanguages(doc.languages);
        const lang = langParam && doc.languages.includes(langParam) ? langParam : doc.languages[0];
        return fetch(`/api/documents/${slug}/${lang}`).then((r) => r.json());
      })
      .then((result) => {
        if (result) setData(result);
      })
      .catch(() => {
        lastFetched.current = null;
        setError(true);
      });
  }, [slug, langParam]);

  if (error) {
    return (
      <>
        <Header languages={[]} currentLang="EN" />
        <main className="min-h-[60vh] flex items-center justify-center px-6">
          <p className="text-[#d4d4d4]">Document not found.</p>
        </main>
      </>
    );
  }

  if (!data) {
    return (
      <>
        <Header languages={[]} currentLang="EN" />
        <main className="min-h-[60vh] flex items-center justify-center px-6">
          <p className="text-[#d4d4d4]">Loading...</p>
        </main>
      </>
    );
  }

  const lang = langParam && languages.includes(langParam) ? langParam : languages[0];
  const dateStr = new Date(data.lastModified).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <>
      <Header languages={languages} currentLang={lang} documentSlug={slug} />
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-6 flex items-center gap-2 text-sm text-[#d4d4d4]">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>Последнее обновление: {dateStr}</span>
        </div>
        <div className="prose prose-invert max-w-none">
          <MarkdownContent content={data.content} documentSlug={slug} />
        </div>
      </main>
    </>
  );
}
