import { resolve } from 'path';
import { tmpdir } from 'os';
import * as z from 'zod';

export const VERSION = '1.0.0';

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

export const SVG_ICONS_REPO = 'spothq/cryptocurrency-icons';
export const SVG_ICONS_OUTPUT_PATH = resolve(
  tmpdir(),
  'spothq/cryptocurrency-icons'
);

export const TokenListEnumSchema = z.enum([
  'aave',
  'coingecko',
  'dharma',
  'roll',
  'synthetix',
]);
export type TokenListEnum = z.infer<typeof TokenListEnumSchema>;

export const TokenListItemSchema = z
  .string()
  .url()
  .nonempty();
export type TokenListItem = z.infer<typeof TokenListItemSchema>;

export const TokenListTypeSchema = z.record(TokenListItemSchema);
export type TokenListType = z.infer<typeof TokenListTypeSchema>;

export const TOKEN_LISTS: TokenListType = {
  aave: 'https://tokenlist.aave.eth.link',
  coingecko: 'https://tokens.coingecko.com/uniswap/all.json',
  dharma: 'https://tokenlist.dharma.eth.link',
  roll: 'https://app.tryroll.com/tokens.json',
  synthetix: 'https://synths.snx.eth.link',
};

export const SOCIAL_SCHEMA = z.object({
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

export const TOKEN_SCHEMA = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  decimals: z.number().min(0),
  deprecation: TokenDeprecationSchema.optional(),
  name: z.string(),
  social: SOCIAL_SCHEMA,
  symbol: z.string(),
  website: z.string().optional(),
});

export type TokenSocialMetadata = z.infer<typeof SOCIAL_SCHEMA>;

/**
 * Raw token data that is loaded from the JSON files.
 */
export interface RawSVGIconToken {
  color: string;
  name: string;
  symbol: string;
}

/**
 * Raw token data that is loaded from the JSON files.
 */
export const RawContractMapTokenSchema = z.object({
  address: z.string(),
  decimals: z.union([z.string(), z.number()]),
  name: z.string(),
  symbol: z.string(),
});

export type RawContractMapToken = z.infer<typeof RawContractMapTokenSchema>;

/**
 * Raw token data that is loaded from the JSON files.
 */
export const RawEthereumListsTokenSchema = z.object({
  address: z.string().optional(),
  decimals: z.union([z.string(), z.number()]).optional(),
  deprecation: TokenDeprecationSchema.optional(),
  name: z.string().optional(),
  social: SOCIAL_SCHEMA.optional(),
  symbol: z.string().optional(),
  website: z.string().optional(),
});

export type RawEthereumListsToken = z.infer<typeof RawEthereumListsTokenSchema>;
/**
 * Parsed token data.
 */
export interface Token {
  address: string;
  decimals: number;
  deprecation?: any;
  name: string;
  newSymbol?: any;
  social?: TokenSocialMetadata;
  symbol: string;
  website?: any;
}
