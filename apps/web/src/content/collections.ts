import { defineCollection, z } from "@repo/typed-mdx";

const collections = {
  blog: defineCollection({
    folder: "blog",
    schema: z.object({
      title: z.string(),
      publishedAt: z.string().transform((str) => new Date(str)),
      tags: z.array(z.string()).optional(),
      author: z.string().optional(),
    }),
  }),
} as const;

export default collections;
