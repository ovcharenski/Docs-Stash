import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function MarkdownContent({
  content,
  documentSlug,
}: {
  content: string;
  documentSlug?: string;
}) {
  const resolveImageSrc = (src: string) => {
    if (!src) return src;
    if (src.startsWith('http://') || src.startsWith('https://')) {
      return `/api/proxy-image?url=${encodeURIComponent(src)}`;
    }
    if (src.startsWith('/')) return src;
    const cleanPath = src.replace(/^\.\//, '');
    return documentSlug ? `/api/document-image/${documentSlug}/${cleanPath}` : src;
  };

  return (
    <div className="markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          img: ({ src, alt, ...props }) => (
            <img
              src={resolveImageSrc(src || '')}
              alt={alt || ''}
              className="max-w-full h-auto rounded-lg my-4"
              {...props}
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
