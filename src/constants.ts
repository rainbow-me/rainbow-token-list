import { tmpdir } from 'os';
import { resolve } from 'path';
import * as z from 'zod';

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

export const TokenListItemSchema = z.string().url().nonempty();
export type TokenListItem = z.infer<typeof TokenListItemSchema>;
export const TokenListTypeSchema = z.record(TokenListItemSchema);
export type TokenListType = z.infer<typeof TokenListTypeSchema>;

export const TOKEN_LISTS: TokenListType = {
  aave: 'https://tokenlist.aave.eth.link',
  coingecko: 'https://tokens.coingecko.com/uniswap/all.json',
  dharma: 'https://tokenlist.dharma.eth.link',
  nftx: 'https://nftx.ethereumdb.com/v2/tokenlist/',
  roll: 'https://app.tryroll.com/tokens.json',
  synthetix: 'https://synths.snx.eth.link',
  wrapped: 'http://wrapped.tokensoft.eth.link',
  yearn: 'https://yearn.science/static/tokenlist.json',
};

export const TokenListEnumSchema = z.enum([
  'aave',
  'coingecko',
  'dharma',
  'nftx',
  'roll',
  'synthetix',
  'wrapped',
  'yearn',
]);
export type TokenListEnum = z.infer<typeof TokenListEnumSchema>;

export const SocialSchema = z.object({
  blog: z.string().optional(),
  chat: z.string().optional(),
  discord: z.string().optional(),
  facebook: z.string().optional(),
  forum: z.string().optional(),
  github: z.string().optional(),
  gitter: z.string().optional(),
  instagram: z.string().optional(),
  linkedin: z.string().optional(),
  medium: z.string().optional(),
  reddit: z.string().optional(),
  slack: z.string().optional(),
  telegram: z.string().optional(),
  twitter: z.string().optional(),
  youtube: z.string().optional(),
});

export const TokenDeprecationSchema = z.object({
  new_address: z.string().optional(),
});

export const TokenExtensionsSchema = z.object({
  color: z.string().optional(),
  isRainbowCurated: z.boolean().optional(),
  isVerified: z.boolean().optional(),
  shadowColor: z.string().optional(),
});
export type TokenExtensionsType = z.infer<typeof TokenExtensionsSchema>;

export const TokenSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  chainId: z.number().optional(),
  decimals: z.number().min(0),
  deprecation: TokenDeprecationSchema.optional(),
  extensions: TokenExtensionsSchema.optional(),
  name: z.string(),
  social: SocialSchema.optional(),
  symbol: z.string(),
  website: z.string().optional(),
});

/**
 * Raw token data that is loaded from the JSON files.
 */
export const RawContractMapTokenSchema = z.object({
  address: z.string(),
  decimals: z.union([z.string(), z.number()]),
  name: z.string(),
  symbol: z.string(),
});

/**
 * Raw token data that is loaded from the JSON files.
 */
export const RawEthereumListsTokenSchema = z.object({
  address: z.string().optional(),
  decimals: z.union([z.string(), z.number()]).optional(),
  deprecation: TokenDeprecationSchema.optional(),
  name: z.string().optional(),
  social: SocialSchema.optional(),
  symbol: z.string().optional(),
  website: z.string().optional(),
});

export type RawContractMapToken = z.infer<typeof RawContractMapTokenSchema>;
export type RawEthereumListsToken = z.infer<typeof RawEthereumListsTokenSchema>;
export type Token = z.infer<typeof TokenSchema>;
export type TokenSocialMetadata = z.infer<typeof SocialSchema>;
