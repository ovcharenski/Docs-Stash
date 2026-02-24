import { Link } from 'wouter';
import { useConfig } from '@/context/ConfigContext';

export function Header({
  languages,
  currentLang,
  documentSlug,
}: {
  languages: string[];
  currentLang: string;
  documentSlug?: string;
}) {
  const { companyName: COMPANY_NAME, redirectUrl: REDIRECT_URL } = useConfig();

  const getLangUrl = (lang: string) => {
    if (documentSlug) return `/${documentSlug}?lang=${lang}`;
    return `/?lang=${lang}`;
  };

  return (
    <header className="border-b border-[#2a2a2a] bg-[#0a0a0a] sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
        {REDIRECT_URL.startsWith('http') ? (
          <a
            href={REDIRECT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <img
              src="/icon.ico"
              alt=""
              className="w-8 h-8 rounded"
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                if (img.src.endsWith('/icon.ico')) {
                  img.src = '/icon.svg';
                  img.onerror = () => {
                    img.style.display = 'none';
                  };
                } else {
                  img.style.display = 'none';
                }
              }}
            />
            <span className="font-bold text-lg">{COMPANY_NAME}</span>
          </a>
        ) : (
          <Link
            href={REDIRECT_URL}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <img
              src="/icon.ico"
              alt=""
              className="w-8 h-8 rounded"
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                if (img.src.endsWith('/icon.ico')) {
                  img.src = '/icon.svg';
                  img.onerror = () => {
                    img.style.display = 'none';
                  };
                } else {
                  img.style.display = 'none';
                }
              }}
            />
            <span className="font-bold text-lg">{COMPANY_NAME}</span>
          </Link>
        )}

        <nav className="flex items-center gap-6">
          {languages.length > 1 && (
            <div className="relative group">
              <button className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-[#2a2a2a] bg-[#141414] text-sm text-[#d4d4d4] hover:text-white hover:border-[hsl(160,8%,50%)] transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                <span>{currentLang}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div className="absolute right-0 mt-1 py-1 w-24 bg-[#1f1f1f] border border-[#2a2a2a] rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                {languages.map((lang) => (
                  <Link
                    key={lang}
                    href={getLangUrl(lang)}
                    className={`block px-3 py-2 text-sm hover:bg-[#2a2a2a] ${
                      lang === currentLang ? 'text-[hsl(160,8%,50%)]' : 'text-[#d4d4d4]'
                    }`}
                  >
                    {lang}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
