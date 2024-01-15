import fs from "node:fs/promises";
import path from "node:path";
import z from "zod";
import matter from "gray-matter";
import { compile } from "@mdx-js/mdx";

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

async function getMDXContent({ path }: { path: string }) {
  try {
    const fileContent = await fs.readFile(path);
    const mdxContent = await compile(fileContent, {
      outputFormat: "function-body",
    });

    return {
      raw: fileContent.toString(),
      code: mdxContent.toString(),
    };
  } catch {
    console.error(`Can't read file ${path}`);
    return {};
  }
}

const metadataSchema = z.object({
  metadata: z.object({
    slug: z.string(),
  }),
  body: z.object({ raw: z.string(), code: z.string() }),
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

      const body = await getMDXContent({
        path: path.resolve(folderPath, mdxFileName),
      });

      const metadata = {
        slug: mdxFileName.substring(
          0,
          mdxFileName.length - MDX_ENTENSION.length
        ),
      };

      return { metadata, body, ...parsedFrontmatter };
    })
  );

  return z
    .array(schema.merge(metadataSchema))
    .parse(data.filter(Boolean)) as any; // TODO FIX THIS ANY
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

  const parsedFrontmatter = await parseMdxFile(filePath, schema);

  const body = await getMDXContent({
    path: path.resolve(filePath),
  });

  const metadata = {
    slug,
  };

  const data = { metadata, body, ...parsedFrontmatter };

  return schema.merge(metadataSchema).parse(data) as any; // TODO FIX THIS ANY
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
