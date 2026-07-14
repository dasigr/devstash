import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ArticleHero } from "@/components/marketing/ArticleHero";
import { AuthorBio } from "@/components/marketing/AuthorBio";
import {
  BLOG_POSTS,
  getBlogPost,
  initials,
} from "@/components/marketing/constants";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { PostMeta } from "@/components/marketing/PostMeta";
import { Prose } from "@/components/marketing/Prose";
import { RelatedPosts } from "@/components/marketing/RelatedPosts";
import { Reveal } from "@/components/marketing/Reveal";

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return { title: "Post" };
  return { title: post.title, description: post.excerpt };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  return (
    <MarketingShell>
      <article className="mx-auto w-full max-w-[760px] px-6 pb-[90px] pt-[136px] max-[560px]:pt-[112px]">
        <Reveal>
          <Link
            href="/blogs"
            className="text-[0.9rem] text-[var(--m-text-mute)] transition-colors hover:text-[var(--m-text)]"
          >
            ← Back to Blog
          </Link>
        </Reveal>

        <Reveal>
          <header className="mt-6 text-center">
            <span
              style={{ "--c": post.accent } as React.CSSProperties}
              className="text-[0.72rem] font-bold uppercase tracking-[0.05em] text-[var(--c)]"
            >
              {post.category}
            </span>
            <h1 className="my-4 text-[clamp(2rem,4.5vw,3rem)] font-extrabold tracking-[-0.02em]">
              {post.title}
            </h1>
            <div className="flex justify-center">
              <PostMeta
                author={post.author}
                date={post.date}
                readTime={post.readTime}
                initials={initials(post.author)}
              />
            </div>
          </header>
        </Reveal>

        <Reveal className="mt-6">
          <ArticleHero />
        </Reveal>

        <Reveal className="mt-10">
          <Prose content={post.content} />
        </Reveal>

        <Reveal className="mt-12">
          <AuthorBio />
        </Reveal>

        <Reveal className="mt-14">
          <RelatedPosts currentSlug={post.slug} />
        </Reveal>
      </article>
    </MarketingShell>
  );
}
