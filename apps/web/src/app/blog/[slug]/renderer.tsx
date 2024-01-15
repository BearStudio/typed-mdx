"use client";

import { Fragment, useEffect, useState } from "react";
import { run } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import { MDXModule } from "node_modules/@mdx-js/mdx/lib/run";

type RendererProps = { code: string };

export const Renderer = ({ code }: RendererProps) => {
  const [mdxModule, setMdxModule] = useState<MDXModule>();
  const Content = mdxModule ? mdxModule.default : Fragment;

  useEffect(
    function () {
      (async function () {
        setMdxModule(await run(code, { ...runtime, baseUrl: undefined }));
      })();
    },
    [code]
  );

  return <Content />;
};
