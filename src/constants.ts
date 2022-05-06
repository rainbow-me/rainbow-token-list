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
  aave: 'https://tokenlist.aave.eth.link',
  coingecko: 'https://tokens.coingecko.com/uniswap/all.json',
  coinmarketcap: 'https://api.coinmarketcap.com/data-api/v3/uniswap/all.json',
  dharma: 'https://tokenlist.dharma.eth.link',
  roll: 'https://app.tryroll.com/tokens.json',
  synthetix: 'https://synths.snx.eth.link',
  wrapped: 'http://wrapped.tokensoft.eth.link',
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
