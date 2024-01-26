// Only support ESM so next.config.mjs
import remarkFrontmatter from "remark-frontmatter";
import createMDX from "@next/mdx";

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["typed-mdx"],
  // Configure `pageExtensions` to include MDX files
  pageExtensions: ["js", "jsx", "mdx", "ts", "tsx"],
  // Do not use the mdxRs yet as it does not support the remarkFrontmatter removal
  // experimental: {
  //   mdxRs: true,
  // },
};

const withMDX = createMDX({
  options: {
    // To remove frontmatter from rendering
    remarkPlugins: [remarkFrontmatter],
  },
});

export default withMDX(nextConfig);
