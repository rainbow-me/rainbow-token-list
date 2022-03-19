import { promises as fs } from 'fs';
import { resolve } from 'path';
import isPlainObject from 'lodash/isPlainObject';
import isString from 'lodash/isString';
import mapValues from 'lodash/mapValues';
import mkdirp from 'mkdirp';
import { ErrorWithCause } from 'pony-cause'; // Once we remove this package from rainbow's build step, we can remove this.
import { Token } from './constants';

/**
 * Reads and parses a JSON file. Throws an error if the file could not be read or if the JSON is invalid.
 *
 * @param {string} file
 * @return {Promise<T>}
 * @template T
 */
export const parseJsonFile = async <T>(file: string): Promise<T> => {
  try {
    const json = await fs.readFile(file, 'utf8');
    return JSON.parse(json);
  } catch (error: Error | any) {
    throw new ErrorWithCause(`Failed to parse file ${file}`, { cause: error });
  }
};

/**
 * Sort tokens alphabetically by symbol.
 *
 * @param {Token[]} tokens
 * @return {Token[]}
 */
export const sortTokens = (tokens: Token[]): Token[] => {
  return tokens.sort((a, b) => a.symbol.localeCompare(b.symbol));
};

/**
 * Creates the output folder if it does not exist yet.
 *
 * @param {string} path
 * @return {Promise<void>}
 */
export const createOutputFolder = async (path: string): Promise<void> => {
  try {
    await fs.access(path);
  } catch (error: Error | any) {
    if (error?.code !== 'ENOENT') {
      throw new ErrorWithCause(`Failed to create output folder: ${path}`, {
        cause: error,
      });
    }

    mkdirp.sync(path);
  }
};

function mapValuesDeep(v: any, callback: any): any {
  return isPlainObject(v)
    ? mapValues(v, (v) => mapValuesDeep(v, callback))
    : callback(v);
}

/**
 * Recursively loop through an token's values and `trim()` any values which are strings.
 *
 * @param {Token} token
 * @return {Token}
 */
export const deeplyTrimAllTokenStrings = (token: Token): Token => {
  return mapValuesDeep(token, (v: any) => (isString(v) ? v.trim() : v));
};

/**
 * Write the Rainbow Token List JSON file to disk.
 *
 * @param {Token[]} tokens
 * @param {string} path
 * @param {string} name
 * @return {Promise<void>}
 */
export const writeToDisk = async (
  tokens: any,
  path: string,
  name: string
): Promise<void> => {
  await createOutputFolder(path);
  const json = JSON.stringify(tokens, null, 2);
  return fs.writeFile(resolve(path, name), json, 'utf8');
};
