import { Renderer } from "@/app/blog/[slug]/renderer";
import collections from "@/content/collections";

export default async function BlogPostPage({
  params,
}: {
  params: { slug: string };
}) {
  const blogPost = await collections.blog.getBySlug(params.slug);
  const author = await collections.author.getBySlug(blogPost.author);

  return (
    <article>
      <h2>{blogPost.title}</h2>
      <small>by {author.name}</small>
      <Renderer code={blogPost.body.code} />
    </article>
  );
}
