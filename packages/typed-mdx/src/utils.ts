import { Future } from "@swan-io/boxed";
import fs from "node:fs/promises";
import path from "node:path";

/**
 * @param filePath The path to the potential file or directory
 * @returns a Future with a Stats Result
 */
export function doesPathExist(filePath: string) {
  return Future.fromPromise(fs.stat(path.resolve(filePath)));
}

/**
 * Is the file path defined and is it a directory?
 * @param filePath The path to the potential directory.
 * @returns a Future with a boolean
 */
export function isDirectory(filePath: string) {
  return doesPathExist(filePath).map((x) =>
    x.isOk() ? x.get().isDirectory() : false
  );
}

/**
 * Is the file path defined and is it a file?
 * @param filePath The path to the potential file.
 * @returns a Future with a boolean
 */
export function isFile(filePath: string) {
  return doesPathExist(filePath).map((x) =>
    x.isOk() ? x.get().isFile() : false
  );
}
