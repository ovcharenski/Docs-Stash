import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { Header } from '@/components/Header';

interface DocInfo {
  slug: string;
  languages: string[];
}

export function HomePage() {
  const [, setLocation] = useLocation();
  const [docs, setDocs] = useState<DocInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const redirected = useRef(false);

  useEffect(() => {
    fetch('/api/documents')
      .then((r) => r.json())
      .then((data: DocInfo[]) => {
        setDocs(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (loading || docs.length === 0 || redirected.current) return;
    redirected.current = true;
    const params = new URLSearchParams(window.location.search);
    const lang = params.get('lang');
    const firstSlug = docs[0].slug;
    const languages = docs[0].languages;
    const langParam = lang && languages.includes(lang) ? lang : languages[0];
    setLocation(`/${firstSlug}?lang=${langParam}`);
  }, [loading, docs, setLocation]);

  if (loading) {
    return (
      <>
        <Header languages={[]} currentLang="EN" />
        <main className="min-h-[60vh] flex items-center justify-center px-6">
          <p className="text-[#d4d4d4]">Loading...</p>
        </main>
      </>
    );
  }

  if (docs.length === 0) {
    return (
      <>
        <Header languages={[]} currentLang="EN" />
        <main className="min-h-[60vh] flex items-center justify-center px-6">
          <p className="text-[#d4d4d4] text-center">No documents are available.</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Header languages={[]} currentLang="EN" />
      <main className="min-h-[60vh] flex items-center justify-center px-6">
        <p className="text-[#d4d4d4]">Redirecting...</p>
      </main>
    </>
  );
}
