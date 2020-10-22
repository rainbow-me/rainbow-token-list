import { promises as fs } from 'fs';
import { resolve } from 'path';
import {
  ETHEREUM_LISTS_OUTPUT_PATH,
  ETHEREUM_LISTS_REPO,
  RawEthereumListsToken,
  Token,
} from './constants';
import { fetchRepository } from './git';
import { parseJsonFile, validateTokenData } from './parser';

export default async function parseEthereumLists(): Promise<Token[]> {
  // fetch the latest commit from `ethereum-lists/tokens` repo and save it to disk
  await fetchRepository(ETHEREUM_LISTS_REPO, ETHEREUM_LISTS_OUTPUT_PATH);

  // load JSON files from directory into array
  const files = await fs.readdir(ETHEREUM_LISTS_OUTPUT_PATH);

  // iterate through JSON files and validate them against our token schema
  return files.reduce<Promise<Token[]>>(async (tokens, file) => {
    const jsonFile = resolve(ETHEREUM_LISTS_OUTPUT_PATH, file);
    const tokenData = await parseJsonFile<RawEthereumListsToken>(jsonFile);
    const token = validateTokenData(tokenData);

    return Promise.resolve([...(await tokens), token]);
  }, Promise.resolve([]));
}
