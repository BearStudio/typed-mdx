import collections from "@/content/collections";

export default async function BlogPostPage({
  params,
}: {
  params: { slug: string };
}) {
  const blogPost = await collections.blog.getBySlug(params.slug);
  const author = await collections.author.getBySlug(blogPost.data.author);

  const Content = (await import(`@/content/${blogPost.metadata.filePath}`))
    .default;
  return (
    <article>
      <h2>{blogPost.data.title}</h2>
      <small>by {author.data.name}</small>
      <Content />
    </article>
  );
}
