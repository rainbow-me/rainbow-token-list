import { promises as fs } from 'fs';
import { resolve } from 'path';
import mkdirp from 'mkdirp';
import partition from 'lodash/partition';
import filter from 'lodash/filter';
import matchesProperty from 'lodash/matchesProperty';
// import omit from 'lodash/omit';
import pick from 'lodash/pick';
// import find from 'lodash/find';
import {
  // RawContractMapToken,
  RawEthereumListsToken,
  SOCIAL_SCHEMA,
  TokenDeprecationSchema,
  Token,
  RawEthereumListsTokenSchema,
  // RawSVGIconToken,
  TOKEN_SCHEMA,
} from './constants';

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
  } catch (error) {
    throw new Error(`Failed to parse file ${file}: ${error.message}`);
  }
};

/**
 * Validate raw token data, by checking if the required values are set and if the decimals are larger than or equal to
 * zero. This will strip any unknown fields and rename the 'decimals' field to 'decimal' for compatibility.
 *
 * @param {RawEthereumListsToken} token
 * @return {boolean}
 */
export const validateTokenData = (
  token: RawEthereumListsToken //
): Token => {
  const normalizedTokenData = {
    ...pick(token, Object.keys(RawEthereumListsTokenSchema.shape)),
    deprecation: pick(
      token.deprecation,
      Object.keys(TokenDeprecationSchema.shape)
    ),
    social: pick(token.social, Object.keys(SOCIAL_SCHEMA.shape)),
  };

  const validToken = TOKEN_SCHEMA.parse(normalizedTokenData);
  const validSocial = SOCIAL_SCHEMA.parse(normalizedTokenData.social);

  return {
    ...validToken,
    social: validSocial,
  } as Token;
};

// /**
//  * Gets all token files from the file system, parses and validates them, fixes any duplicates and sorts them by symbol.
//  *
//  * @param {string} path
//  * @param {string[]} exclude
//  * @return {Promise<Token[]>}
//  */
// export const parseSVGIconTokenFiles = async (
//   path: string,
//   exclude: string[]
// ): Promise<RawSVGIconToken[]> => {
//   const tokenData = await parseJsonFile<RawSVGIconToken[]>(resolve(path, 'manifest.json'));
//   // console.log('tokenData', tokenData);

//   // console.log('normalizedTokenData', normalizedTokenData);
//   // if (exclude.includes(token.address.toLowerCase())) {
//   //   return tokens;
//   // }

//   return Promise.resolve(tokenData);
// };

// /**
//  * Gets all token files from the file system, parses and validates them, fixes any duplicates and sorts them by symbol.
//  *
//  * @param {string} path
//  * @param {string[]} exclude
//  * @return {Promise<Token[]>}
//  */
// export const parseEthereumListTokenFiles = async (
//   path: string,
//   exclude: string[]
// ): Promise<Token[]> => {
//   const files = await fs.readdir(path);

//   console.log('files # ', files.length)

//   return files.reduce<Promise<Token[]>>(async (tokens, file) => {
//     const tokenData = await parseJsonFile<RawEthereumListsToken>(resolve(path, file));
//     const token = validateTokenData(tokenData);

//     if (exclude.includes(token.address.toLowerCase())) {
//       return tokens;
//     }

//     return Promise.resolve([...(await tokens), token]);
//   }, Promise.resolve([]));
// };

/**
 * Finds deprecated tokens and replaces them with the data
 * for the latest version of the token
 *
 * @param {Token} token
 * @param {index} number
 * @param {Token[]} tokens
 *
 * @return {Token}
 */
export function resolveDeprecations(tokens: Token[]): Token[] {
  return tokens.map(({ deprecation, ...token }: Token) => {
    if (deprecation) {
      const newAddress = deprecation.new_address;
      const newToken = tokens.find(matchesProperty('address', newAddress));
      return newToken || token;
    }

    return token;
  });
}

/**
 * Finds duplicate tokens and changes the symbols for the duplicates.
 *
 * @param {Token[]} tokens
 * @return {Token[]}
 */
export const fixDuplicates = (tokens: Token[]): Token[][] => {
  const [uniqueTokens, duplicateTokens] = partition(tokens, token => {
    const dups = filter(tokens, matchesProperty('symbol', token.symbol));
    return dups.length === 1;
  });

  // console.log('uniqueTokens', uniqueTokens[0]);
  // console.log('duplicateTokens', duplicateTokens[0]);
  return [uniqueTokens, duplicateTokens];
};


  // return uniqueTokens.map(
  //   ({ address, decimals, name, social, symbol, uuid, website = '' }) => {
  //     return {
  //       address,
  //       decimals,
  //       name,
  //       social,
  //       symbol,
  //       uuid,
  //       website,
  //     };
  //   }
  // );

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
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw new Error(`Failed to create output folder: ${error.message}`);
    }

    mkdirp.sync(path);
  }
};

/**
 * Write the resulting token array to a file on the disk. This assumes that the output path specified exists, and is a
 * folder.
 *
 * @param {Token[]} tokens
 * @param {string} path
 * @param {string} name
 * @return {Promise<void>}
 */
export const writeToDisk = async (
  tokens: Token[],
  path: string,
  name: string
): Promise<void> => {
  const json = JSON.stringify(tokens, null, 2);
  return fs.writeFile(resolve(path, name), json, 'utf8');
};
