import { tmpdir } from 'os';
import { resolve } from 'path';

export const CONTRACT_MAP_REPO = 'metamask/eth-contract-metadata';
export const CONTRACT_MAP_OUTPUT_PATH = resolve(
  tmpdir(),
  'eth-contract-metadata'
);

// note the specific subdirectory here. we only want the 'eth' directory 🧠️
export const ETHEREUM_LISTS_REPO = 'ethereum-lists/tokens/tokens/eth';
export const ETHEREUM_LISTS_OUTPUT_PATH = resolve(
  tmpdir(),
  'ethereum-lists/tokens'
);

export type TokenListType = Record<TokenListEnum, string>;

export const TOKEN_LISTS: TokenListType = {
  aave: 'https://cloudflare-ipfs.com/ipfs/QmTP6pKCE6HQGohYJCjMmHLqLUfScHKWic3L3Cg5yah6J9',
  coingecko: 'https://tokens.coingecko.com/uniswap/all.json',
  coinmarketcap: 'https://api.coinmarketcap.com/data-api/v3/uniswap/all.json',
  dharma:
    'https://cloudflare-ipfs.com/ipfs/QmYMN2t89HmRx832qxBwLK1naLgcxCPQ9fZEMqwMwEmCax',
  roll: 'https://app.tryroll.com/tokens.json',
  synthetix:
    'https://cloudflare-ipfs.com/ipfs/QmPe1JqDyNy7Jd9wFmqBEkgMW6BQHwJgeX1RAErnKfVfh7',
  wrapped: 'https://wrapped.com/tokenlist.json',
};

export enum TokenListEnumSchema {
  aave = 'aave',
  coingecko = 'coingecko',
  coinmarketcap = 'coinmarketcap',
  dharma = 'dharma',
  roll = 'roll',
  synthetix = 'synthetix',
  wrapped = 'wrapped',
}

export type TokenListEnum = `${TokenListEnumSchema}`;

export enum ChainIDEnumSchema {
  mainnet = '1',
  optimism = '10',
}

export interface TokenDeprecationSchema {
  new_address?: string;
}

export interface TokenExtensionsSchema {
  color?: string;
  isRainbowCurated?: boolean;
  isVerified?: boolean;
  shadowColor?: string;
}

export interface Token {
  address: string;
  chainId?: number;
  decimals: number;
  deprecation?: TokenDeprecationSchema;
  extensions?: TokenExtensionsSchema;
  name: string;
  symbol: string;
}

/**
 * Raw token data that is loaded from the JSON files.
 */
export interface RawContractMapTokenSchema {
  address: string;
  decimals: string | number;
  name: string;
  symbol: string;
}

/**
 * Raw token data that is loaded from the JSON files.
 */
export interface RawEthereumListsTokenSchema {
  address?: string;
  decimals?: string | number;
  name?: string;
  symbol?: string;
  website?: string;
}
