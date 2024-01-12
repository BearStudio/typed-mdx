import { defineCollection, z } from "@repo/typed-mdx";

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
  author: defineCollection({
    folder: "author",
    schema: z.object({
      name: z.string(),
      socials: z.array(
        z.object({
          type: z.enum(["x", "linkedin"]),
          href: z.string().url(),
        })
      ),
    }),
  }),
} as const;

export default collections;
