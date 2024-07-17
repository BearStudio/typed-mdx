import Link from "next/link";
import collections from "@/content/collections";
import styles from "./page.module.css";

export default async function Page() {
  const posts = await collections.blog.getAll();

  return (
    <main className={styles.main}>
      <h1>My Blog</h1>

      <ul>
        {posts.map((post) => (
          <li key={post.data.title}>
            <Link href={`/blog/${post.metadata.slug}`}>
              {post.data.title} {post.data.author && <>by {post.data.author}</>}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
