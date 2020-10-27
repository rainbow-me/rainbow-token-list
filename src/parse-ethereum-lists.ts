import { promises as fs } from 'fs';
import filter from 'lodash/filter';
import matchesProperty from 'lodash/matchesProperty';
import partition from 'lodash/partition';
import { resolve } from 'path';
import {
  ETHEREUM_LISTS_OUTPUT_PATH,
  ETHEREUM_LISTS_REPO,
  RawEthereumListsToken,
  Token,
} from './constants';
import { fetchRepository } from './git';
import { parseJsonFile, validateTokenData } from './parser';

/**
 * Partition tokens array into two categories: unique vs duplicates, according to
 * their token symbol
 *
 * @param {Token[]} tokens
 * @return {Token[][]}
 */
export const partitionByUniqueness = (tokens: Token[]): Token[][] => {
  const [uniqueTokens, duplicateTokens] = partition(tokens, token => {
    const dups = filter(tokens, ['symbol', token.symbol]);
    return dups.length === 1;
  });
  return [uniqueTokens, duplicateTokens];
};

/**
 * Finds deprecated tokens and replaces them with the data
 * for the latest version of the token
 *
 * @param {Token[]} tokens
 *
 * @return {Token[]}
 */
export function resolveDeprecations(tokens: Token[]): Token[] {
  return tokens.map(({ deprecation, ...token }: Token) => {
    return !deprecation?.new_address
      ? token
      : tokens.find(matchesProperty('address', deprecation.new_address)) ||
          token;
  });
}

/**
 * Load the token JSON files from directory, and then validate them
 * against our token schema
 *
 * @return {Token[]}
 */
export async function parseEthereumListsTokenFiles(): Promise<Token[]> {
  const files = await fs.readdir(ETHEREUM_LISTS_OUTPUT_PATH);

  return files.reduce<Promise<Token[]>>(async (tokens, file) => {
    const jsonFile = resolve(ETHEREUM_LISTS_OUTPUT_PATH, file);
    const tokenData = await parseJsonFile<RawEthereumListsToken>(jsonFile);
    const token = validateTokenData(tokenData);

    return Promise.resolve([...(await tokens), token]);
  }, Promise.resolve([]));
}

/**
 * Fetch the latest commit from `ethereum-lists/tokens` repo and parse
 * the saved JSON files
 *
 * @return {Token[][]}
 */
export default async function parseEthereumLists(): Promise<Token[][]> {
  await fetchRepository(ETHEREUM_LISTS_REPO, ETHEREUM_LISTS_OUTPUT_PATH);
  return parseEthereumListsTokenFiles()
    .then(resolveDeprecations)
    .then(partitionByUniqueness);
}
