import fs from "node:fs/promises";
import path from "node:path";
import z from "zod";
import matter from "gray-matter";

export { z } from "zod";

const CONTENT_FOLDER = "src/content";

function assertSchemaIsObject(
  schema: z.Schema
): asserts schema is z.AnyZodObject {
  if (!(schema instanceof z.ZodObject)) {
    throw new Error("The zod schema of a collection should be a `z.object`");
  }
}

/** Method to get the frontmatter as a JavaScript object */
function parseFrontmatter(fileContents: matter.Input) {
  try {
    // `matter` is empty string on cache results
    // clear cache to prevent this
    (matter as any).clearCache();
    return matter(fileContents);
  } catch (e) {
    throw e;
  }
}

async function parseMdxFile<Z extends z.Schema>(
  mdxPath: string,
  schema: Z
): Promise<z.infer<Z>> {
  const filePath = path.resolve(mdxPath);
  const frontmatter = parseFrontmatter(await fs.readFile(filePath));

  const result = schema.safeParse(frontmatter.data);

  if (!result.success) {
    console.group(`Errors in ${mdxPath}`);
    result.error.formErrors.formErrors.forEach((error) => {
      console.error("❌", error);
    });
    Object.entries(result.error.formErrors.fieldErrors).forEach(
      ([path, errors]) => {
        console.group(`👉 Field \`${path}\``);
        errors?.forEach((error) => console.error("❌", error));
        console.groupEnd();
      }
    );
    console.groupEnd();
    throw new Error("---");
  }

  return frontmatter.data;
}

const metadataSchema = z.object({
  metadata: z.object({
    slug: z.string(),
  }),
});

const MDX_ENTENSION = ".mdx";

async function getAll<Z extends z.Schema>({
  folder,
  schema,
}: {
  folder: string;
  schema: Z;
}): Promise<(z.infer<Z> & z.infer<typeof metadataSchema>)[]> {
  assertSchemaIsObject(schema);

  const folderPath = `${CONTENT_FOLDER}/${folder}`;
  const postFilePaths = await fs.readdir(path.resolve(folderPath));

  const mdxFileNames = postFilePaths.filter(
    (postFilePath) => path.extname(postFilePath).toLowerCase() === MDX_ENTENSION
  );

  const data = await Promise.all(
    mdxFileNames.map(async (mdxFileName) => {
      const parsedFrontmatter = await parseMdxFile(
        `${folderPath}/${mdxFileName}`,
        schema
      );

      const metadata = {
        slug: mdxFileName.substring(
          0,
          mdxFileName.length - MDX_ENTENSION.length
        ),
      };

      return { metadata, ...parsedFrontmatter };
    })
  );

  return z
    .array(schema.merge(metadataSchema))
    .parse(data.filter(Boolean)) as any; // FIX THIS
}

async function getBySlug<Z extends z.Schema>({
  folder,
  slug,
  schema,
}: {
  folder: string;
  schema: Z;
  slug: string;
}): Promise<z.infer<Z> & z.infer<typeof metadataSchema>> {
  assertSchemaIsObject(schema);

  const filePath = `${CONTENT_FOLDER}/${folder}/${slug}.mdx`;

  try {
    await fs.stat(path.resolve(filePath));
  } catch {
    throw new Error(`File ${filePath} not found`);
  }

  const data = await parseMdxFile(filePath, schema);

  // Trick to make zod infer the schema, else it doesn't infer if we do not put
  // the z.object({}) before. Maybe the generic is not small enough ?
  return schema.parse(data);
}

export function defineCollection<Z extends z.Schema>(options: {
  folder: string;
  schema: Z;
  strict?: boolean;
}): {
  getAll: () => Promise<(z.infer<Z> & z.infer<typeof metadataSchema>)[]>;
  getBySlug: (
    slug: string
  ) => Promise<z.infer<Z> & z.infer<typeof metadataSchema>>;
  schema: Z;
} {
  assertSchemaIsObject(options.schema);

  const schema =
    options.strict === false ? options.schema : options.schema.strict();

  return {
    getAll: () => getAll({ folder: options.folder, schema }),
    getBySlug: (slug) => getBySlug({ folder: options.folder, schema, slug }),
    schema: schema as Z,
  } as const;
}
