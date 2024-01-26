# `typed-mdx`

`typed-mdx` is heavily inspired by [Contentlayer](https://contentlayer.dev/) and
[Astro Content Collection](https://docs.astro.build/en/guides/content-collections/).

It comes from the frustration that Contentlayer is not maintained anymore (and
wanted to do too much as we only want to support md and mdx ) and there is no
other alternative to Astro Content Collection for Next.js.

## Installation

```bash
npm install typed-mdx zod @next/mdx @mdx-js/loader @mdx-js/react @types/mdx remark-frontmatter
yarn add typed-mdx zod @next/mdx @mdx-js/loader @mdx-js/react @types/mdx remark-frontmatter
pnpm add typed-mdx zod @next/mdx @mdx-js/loader @mdx-js/react @types/mdx remark-frontmatter
```

## Usage

In a Next.js application, create a `src/content` folder. Then, create a
`collections.ts`.

We will define our collections in that file:

```ts
import { defineCollection } from "typed-mdx";
import { z } from "zod";

const collections = {
  blog: defineCollection({
    folder: "blog",
    schema: z.object({
      title: z.string(),
      publishedAt: z.string().transform((str) => new Date(str)),
      tags: z.array(z.string()).optional(),
      author: z.string(),
    }),
  }),
} as const;

export default collections;
```

You can define as many collection as you want. Then, in the file you want to use
your collection, import the exported object and use it in your components:

```ts
import collections from "@/content/collections";

export default async function Page() {
  const posts = await collections.blog.getAll();

  return (
    <ul>
      {posts.map((post) => (
        <li key={post.title}>
          <Link href={`/blog/${post.metadata.slug}`}>
            {post.title} {post.author && <>by {post.author}</>}
          </Link>
        </li>
      ))}
    </ul>
  );
}
```

To show the MDX content, please note that it works with the `@next/mdx` package.
Setup the `next.config.mjs`:

```mjs
// Only support ESM so next.config.mjs
import remarkFrontmatter from "remark-frontmatter";
import createMDX from "@next/mdx";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure `pageExtensions` to include MDX files
  pageExtensions: ["js", "jsx", "mdx", "ts", "tsx"],
};

const withMDX = createMDX({
  options: {
    // To remove frontmatter from rendering
    remarkPlugins: [remarkFrontmatter],
  },
});

export default withMDX(nextConfig);
```

If you are using the Next.js `app` router, you'll need `mdx-component.tsx` file
at the root of your project.

```tsx
import type { MDXComponents } from "mdx/types";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
  };
}
```
