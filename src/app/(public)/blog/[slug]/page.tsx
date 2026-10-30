import { PageTransition } from '@/components/page-transition';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PostView } from '@/components/views';
import { getPostBySlug, getPosts } from '@/lib/queries';

type Props = { params: Promise<{ slug: string }> };

// La page attend son contenu complet avant de s'afficher : une adresse inconnue reçoit ainsi un vrai
// code 404, et le titre de la carte peut se transformer en titre de la fiche pendant la navigation.
export const instant = false;

export async function generateStaticParams() {
  const posts = await getPosts();
  return posts.length > 0 ? posts.map((post) => ({ slug: post.slug })) : [{ slug: '__aucun__' }];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPostBySlug((await params).slug);
  if (!post) return { title: 'Article introuvable' };
  return {
    title: post.title,
    description: post.excerpt || undefined,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.excerpt || undefined,
      type: 'article',
      publishedTime: post.publishAt?.toISOString(),
      images: post.coverUrl ? [post.coverUrl] : undefined,
    },
  };
}

export default async function PostPage({ params }: Props) {
  const post = await getPostBySlug((await params).slug);
  if (!post) notFound();
  return (
    <PageTransition>
      <PostView post={post} />
    </PageTransition>
  );
}
