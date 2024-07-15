import collections from "@/content/collections";

export default async function BlogPostPage({
  params,
}: {
  params: { slug: string };
}) {
  const blogPost = await collections.blog.getBySlug(params.slug);
  const author = await collections.author.getBySlug(blogPost.author);

  const Content = (await import(`@/content/${blogPost.metadata.filePath}`))
    .default;
  console.log(blogPost.body);
  return (
    <article>
      <h2>{blogPost.title}</h2>
      <small>by {author.name}</small>
      <Content />
    </article>
  );
}
