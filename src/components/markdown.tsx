import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import 'katex/dist/katex.min.css';

/**
 * Rendu du Markdown saisi dans l'admin (blog, page SCAT, fiches projet, pages légales).
 * Le HTML brut n'est pas interprété ; les formules $...$ et $$...$$ sont composées par KaTeX.
 */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // Les titres du contenu commencent au niveau 2 : le h1 est réservé au titre de la page.
          h1: ({ children: content }) => <h2>{content}</h2>,
          a: ({ href = '', children: content }) => {
            const external = /^https?:\/\//.test(href);
            return (
              <a href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                {content}
              </a>
            );
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
