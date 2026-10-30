import { PageTransition } from '@/components/page-transition';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { RevealGroup, RevealItem } from '@/components/motion';
import { NAV_FORWARD, Shared } from '@/components/page-transition';
import { Container } from '@/components/ui';
import { PageHeader } from '@/components/views';
import { formatDate } from '@/lib/format';
import { getPosts } from '@/lib/queries';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Articles sur les réseaux, la recherche et l’enseignement.',
  alternates: { canonical: '/blog' },
};

export default async function BlogPage() {
  const posts = await getPosts();

  return (
    <PageTransition>
      <Container className="py-12 sm:py-16">
        <PageHeader label="/Blog" title="Articles" />
        {posts.length > 0 ? (
          <RevealGroup className="mt-10 grid gap-6 md:grid-cols-2">
            {posts.map((post) => (
              <RevealItem key={post.id}>
                <article className="card lift group relative flex h-full flex-col overflow-hidden hover:border-field">
                  {post.coverUrl && (
                    <div className="relative aspect-[16/9] overflow-hidden border-b border-line bg-surface">
                      <Image
                        src={post.coverUrl}
                        alt=""
                        fill
                        sizes="(min-width: 768px) 50vw, 100vw"
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="flex flex-1 flex-col p-7">
                    <p className="meta-mono">
                      {[
                        post.category,
                        post.publishAt && formatDate(post.publishAt),
                        post.readTime > 0 && `${post.readTime} min`,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                    <h2 className="mt-3 font-serif text-[1.75rem] leading-tight font-medium text-ink">
                      <Link
                        href={`/blog/${post.slug}`}
                        transitionTypes={NAV_FORWARD}
                        className="after:absolute after:inset-0 after:rounded-card"
                      >
                        <Shared name={`titre-article-${post.slug}`}>
                          <span className="inline-block">{post.title}</span>
                        </Shared>
                      </Link>
                    </h2>
                    {post.excerpt && <p className="mt-3 leading-relaxed text-ink-2">{post.excerpt}</p>}
                  </div>
                </article>
              </RevealItem>
            ))}
          </RevealGroup>
        ) : (
          <p className="card mt-10 p-8 text-ink-2">Aucun article publié pour le moment.</p>
        )}
      </Container>
    </PageTransition>
  );
}
