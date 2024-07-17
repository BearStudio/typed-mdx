import fs from "node:fs/promises";
import path from "node:path";
import z from "zod";
import matter from "gray-matter";
import { Result } from "@swan-io/boxed";
import { isDirectory, isFile } from "./utils.js";

const CONTENT_FOLDER = "src/content";

type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

function assertSchemaIsObject(
  schema: z.Schema
): asserts schema is z.AnyZodObject {
  if (!(schema instanceof z.ZodObject)) {
    throw new Error("The zod schema of a collection should be a `z.object`");
  }
}

/** Method to get the frontmatter as a JavaScript object */
function parseFrontmatter(
  fileContents: matter.Input
): Result<matter.GrayMatterFile<string | Buffer>, string> {
  try {
    // `matter` is empty string on cache results
    // clear cache to prevent this
    (matter as any).clearCache();
    return Result.Ok(matter(fileContents));
  } catch (e) {
    return Result.Error("Unable to parse the frontmatter");
  }
}

async function parseMdxFile<Z extends z.Schema>(
  mdxPath: string,
  schema: Z
): Promise<z.infer<Z>> {
  const filePath = path.resolve(mdxPath);
  const frontmatterResult = parseFrontmatter(await fs.readFile(filePath));

  if (frontmatterResult.isError()) {
    throw new Error(frontmatterResult.error);
  }

  const frontmatter = frontmatterResult.get().data;

  const result = schema.safeParse(frontmatter);

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

  return frontmatter;
}
async function stringifyMDX(mdxPath: string): Promise<string> {
  const filePath = path.resolve(mdxPath);
  const frontmatterResult = parseFrontmatter(await fs.readFile(filePath));

  if (frontmatterResult.isError()) {
    throw new Error(frontmatterResult.error);
  }

  const frontmatter = frontmatterResult.get().content;

  return frontmatter;
}

const metadataSchema = z.object({
  slug: z.string(),
  filePath: z.string(),
});

const MDX_ENTENSION = ".mdx";

async function getAll<Z extends z.Schema>({
  folder,
  schema,
}: {
  folder: string;
  schema: Z;
}): Promise<
  {
    data: z.infer<Z>;
    body: string;
    metadata: z.infer<typeof metadataSchema>;
  }[]
> {
  assertSchemaIsObject(schema);

  const folderPath = `${CONTENT_FOLDER}/${folder}`;

  if (!(await isDirectory(folderPath)).valueOf()) {
    throw new Error(
      `💥 Folder ${folderPath} does not exist or is not a directory`
    );
  }

  const postFilePaths = await fs.readdir(path.resolve(folderPath));

  const mdxFileNames = postFilePaths.filter(
    (postFilePath) => path.extname(postFilePath).toLowerCase() === MDX_ENTENSION
  );
  return await Promise.all(
    mdxFileNames.map(async (mdxFileName) => {
      const parsedFrontmatter = await parseMdxFile(
        `${folderPath}/${mdxFileName}`,
        schema
      );

      const slug = mdxFileName.substring(
        0,
        mdxFileName.length - MDX_ENTENSION.length
      );
      const metadata = {
        slug,
        filePath: `${folder}/${slug}.mdx`,
      };
      const body = await stringifyMDX(`${folderPath}/${mdxFileName}`);

      return { metadata, body, data: parsedFrontmatter };
    })
  );
}

async function getBySlug<Z extends z.Schema>({
  folder,
  slug,
  schema,
}: {
  folder: string;
  schema: Z;
  slug: string;
}): Promise<{
  data: z.infer<Z>;
  body: string;
  metadata: z.infer<typeof metadataSchema>;
}> {
  assertSchemaIsObject(schema);

  const filePath = `${CONTENT_FOLDER}/${folder}/${slug}.mdx` as const;

  if (!(await isFile(filePath)).valueOf()) {
    throw new Error(`💥 File ${filePath} does not exist or is not a file`);
  }

  const parsedFrontmatter = await parseMdxFile(filePath, schema);

  const metadata = {
    slug,
    filePath: `${folder}/${slug}.mdx`,
  };

  const body = await stringifyMDX(filePath);

  return { metadata, body, data: parsedFrontmatter } as any; // TODO FIX THIS ANY
}

export function defineCollection<Z extends z.Schema>(options: {
  folder: string;
  schema: Z;
  strict?: boolean;
}): {
  getAll: () => Promise<
    Prettify<{
      data: z.infer<Z>;
      body: string;
      metadata: z.infer<typeof metadataSchema>;
    }>[]
  >;
  getBySlug: (slug: string) => Promise<
    Prettify<{
      data: z.infer<Z>;
      body: string;
      metadata: z.infer<typeof metadataSchema>;
    }>
  >;
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
