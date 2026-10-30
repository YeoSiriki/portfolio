// Rendu du Markdown de l'admin : les formules doivent rester composées par KaTeX (version imposée par
// « overrides » dans package.json) et le HTML brut ne doit jamais être interprété.
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Markdown } from '@/components/markdown';

const render = (source: string) => renderToStaticMarkup(createElement(Markdown, null, source));

describe('rendu Markdown', () => {
  it('compose les formules en ligne et en bloc avec KaTeX', () => {
    // Une formule en bloc s'écrit avec $$ seuls sur leur ligne, avant et après.
    const html = render('Couverture : $C = \\frac{n}{N}$\n\n$$\n\\sum_{i=1}^{n} x_i\n$$');
    expect(html).toContain('class="katex"');
    expect(html).toContain('katex-display');
    expect(html).not.toContain('katex-error');
  });

  it("n'interprète pas le HTML brut", () => {
    const html = render('<script>alert(1)</script> texte');
    expect(html).not.toContain('<script>');
  });

  it('ouvre les liens externes dans un nouvel onglet', () => {
    expect(render('[GitHub](https://github.com/YeoSiriki)')).toContain('target="_blank"');
  });
});
