import collections from "../../../content/collections";

export default async function BlogPostPage({
  params,
}: {
  params: { slug: string };
}) {
  const blogPost = await collections.blog.getBySlug(params.slug);
  const author = await collections.author.getBySlug(blogPost.author);

  return (
    <>
      {blogPost.title} by {author.name}
    </>
  );
}
