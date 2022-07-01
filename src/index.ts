#!/usr/bin/env node

/* eslint-disable no-console */
import { resolve } from 'path';
import { getAddress } from '@ethersproject/address';
import {
  compact,
  filter,
  keyBy,
  matchesProperty,
  merge,
  toLower,
} from 'lodash';
import { Token, TokenExtensionsSchema } from './constants';
import * as Types from './constants';
import parseContractMap from './parse-contract-map';
import parseEthereumLists from './parse-ethereum-lists';
import parseOverrideFile from './parse-overrides';
import parseSVGIconTokenFiles from './parse-svg-icons';
import parseTokenLists from './parse-token-lists';
import { deeplyTrimAllTokenStrings, sortTokens, writeToDisk } from './parser';
import { verifyTokens } from './verify-tokens';

export { Types };

console.log('🌈️ building the rainbow token list');

function normalizeList(list: any[]) {
  return keyBy(list, ({ address }) => (address ? getAddress(address) : ''));
}

// Entry point
(async function () {
  const p1 = parseContractMap();
  const p2 = parseEthereumLists();
  const p3 = parseOverrideFile();
  const p4 = parseSVGIconTokenFiles();
  const p5 = parseTokenLists();

  const [
    contractMapTokens,
    [uniqueEthereumListTokens, duplicateEthereumListTokens],
    rainbowOverrides,
    svgIcons,
    tokenListTokens,
  ] = await Promise.all([p1, p2, p3, p4, p5]);
  const { coingecko, coinmarketcap, ...preferredTokenLists } = tokenListTokens;

  const preferredTokens: Token[] = Object.values(preferredTokenLists)
    .map(({ tokens }: any) => tokens)
    .flat();

  // coingecko ∩ coinmarketcap are tokens we want to consider for verification
  const tokensToConsiderAsVerified =
    coingecko.tokens?.filter((token) =>
      coinmarketcap.tokensByAddress.has(toLower(token.address))
    ) ?? [];

  const verifiedTokens = await verifyTokens(tokensToConsiderAsVerified);

  const sources = {
    default: [
      duplicateEthereumListTokens,
      uniqueEthereumListTokens,
      contractMapTokens,
      coingecko.tokens?.flat() as any,
    ].map(normalizeList),
    preferred: [preferredTokens, verifiedTokens].map(normalizeList),
  };

  const defaultSources: any = merge({}, ...sources.default);
  const allKnownTokenAddresses = new Set(
    compact([
      ...sources.default.map(Object.keys).flat(),
      ...sources.preferred.map(Object.keys).flat(),
    ]).map(getAddress)
  );

  const lowerAllKnownTokenAddresses = new Set(
    Array.from(allKnownTokenAddresses).map(toLower)
  );

  // These tokens were added in the rainbow-token-list repo and are not/have not been recognized upstream by any token source providers
  const rainbowAddedTokensWithNoSource = new Set(
    Object.keys(rainbowOverrides)
      .filter(
        (tokenAddress) =>
          !lowerAllKnownTokenAddresses.has(toLower(tokenAddress))
      )
      // Forces us to add the correct checksummed address in rainbow-overrides.json
      .map(getAddress)
  );

  function resolveTokenInfo(tokenAddress: string) {
    const lowerTokenAddress = tokenAddress.toLowerCase();

    switch (true) {
      case tokenListTokens.synthetix.tokensByAddress.has(lowerTokenAddress):
        return tokenListTokens.synthetix.tokensByAddress.get(lowerTokenAddress);
      case tokenListTokens.aave.tokensByAddress.has(lowerTokenAddress):
        return tokenListTokens.aave.tokensByAddress.get(lowerTokenAddress);
      case tokenListTokens.roll.tokensByAddress.has(lowerTokenAddress):
        return tokenListTokens.roll.tokensByAddress.get(lowerTokenAddress);
      case tokenListTokens.dharma.tokensByAddress.has(lowerTokenAddress):
        return tokenListTokens.dharma.tokensByAddress.get(lowerTokenAddress);
      case tokenListTokens.wrapped.tokensByAddress.has(lowerTokenAddress):
        return tokenListTokens.wrapped.tokensByAddress.get(lowerTokenAddress);
      case tokenListTokens.coingecko.tokensByAddress.has(lowerTokenAddress):
        return tokenListTokens.coingecko.tokensByAddress.get(lowerTokenAddress);
    }

    return defaultSources[tokenAddress];
  }

  function buildTokenList() {
    const tokens = [];
    const rainbowModifiedTokens = [];
    for (let tokenAddress of Array.from(allKnownTokenAddresses)) {
      const token = resolveTokenInfo(tokenAddress);
      const overrideToken = rainbowOverrides[tokenAddress];

      let { chainId = 1, color, decimals, name, shadowColor, symbol } = token;

      let isVerified =
        sources.preferred.map(Object.keys).flat().includes(tokenAddress) ||
        overrideToken?.isCurated;

      if (isVerified) {
        const logoData = svgIcons.find((item) => item.symbol === symbol);
        color = logoData?.color;
      }

      // If "isVerified" is declared in rainbow-overrides.json then it should take precedent
      isVerified =
        overrideToken?.isVerified !== undefined
          ? overrideToken.isVerified
          : isVerified;

      const extensions: TokenExtensionsSchema = {
        color: overrideToken?.color || color,
        isRainbowCurated: overrideToken?.isCurated ? true : undefined,
        isVerified: isVerified,
        shadowColor: overrideToken?.shadowColor || shadowColor,
      };

      const parsedToken = deeplyTrimAllTokenStrings({
        address: tokenAddress,
        chainId,
        decimals,
        name: overrideToken?.name || name,
        symbol: overrideToken?.symbol || symbol,
        ...(compact(Object.values(extensions)).length
          ? { extensions }
          : undefined),
      });
      tokens.push(parsedToken);
      if (
        compact(Object.values(extensions)).length ||
        (overrideToken?.name ?? name) !== name ||
        (overrideToken?.symbol ?? symbol) !== symbol
      ) {
        rainbowModifiedTokens.push(parsedToken);
      }
    }

    /**
     * Tokens added from rainbow-overrides.json that are not listed upstream will be added to the token list
     * but we will block compilation if they are missing core metadata
     */
    const rainbowAddedTokens = Array.from(rainbowAddedTokensWithNoSource).map(
      (tokenAddress: string) => {
        const token = rainbowOverrides[tokenAddress];

        let {
          color,
          decimals,
          name,
          shadowColor,
          symbol,
          isVerified,
          isCurated,
        } = token;

        if (!name) {
          throw new Error(
            `Rainbow added token ${tokenAddress} not found in upstream token sources and is missing name`
          );
        }

        if (!symbol) {
          throw new Error(
            `Rainbow added token ${tokenAddress} not found in upstream token sources and is missing symbol`
          );
        }

        if (!decimals) {
          throw new Error(
            `Rainbow added token ${tokenAddress} not found in upstream token sources and is missing decimals`
          );
        }

        if (isVerified) {
          const logoData = svgIcons.find((item) => item.symbol === symbol);
          color = logoData?.color;
        }

        const extensions: TokenExtensionsSchema = {
          color: color,
          isRainbowCurated: isCurated,
          isVerified: isVerified || isCurated ? true : undefined,
          shadowColor: shadowColor,
        };

        return deeplyTrimAllTokenStrings({
          address: tokenAddress,
          chainId: 1,
          decimals,
          name: name,
          symbol: symbol,
          ...(compact(Object.values(extensions)).length
            ? { extensions }
            : undefined),
        });
      }
    );

    return [
      [...tokens, ...rainbowAddedTokens],
      [...rainbowModifiedTokens, ...rainbowAddedTokens],
    ];
  }

  const [tokens, leanTokens] = buildTokenList();
  const tokensSorted = await sortTokens(tokens);
  const leanTokensSorted = await sortTokens(leanTokens);

  await writeToDisk(
    {
      keywords: ['rainbow'],
      logoURI: 'https://avatars0.githubusercontent.com/u/48327834?s=200&v=4',
      name: 'Rainbow Token List',
      timestamp: new Date().toISOString(),
      tokens: tokensSorted,
      version: {
        major: 1,
        minor: 2,
        patch: 1,
      },
    },
    resolve(process.cwd(), './output'),
    'rainbow-token-list.json'
  );

  await writeToDisk(
    {
      keywords: ['rainbow'],
      logoURI: 'https://avatars0.githubusercontent.com/u/48327834?s=200&v=4',
      name: 'Lean Rainbow Token List',
      timestamp: new Date().toISOString(),
      tokens: leanTokensSorted,
      version: {
        major: 1,
        minor: 2,
        patch: 1,
      },
    },
    resolve(process.cwd(), './output'),
    'lean-rainbow-token-list.json'
  );

  console.log(`# of tokens: ${tokens.length}`);

  ['isRainbowCurated', 'isVerified'].forEach((extension) => {
    console.log(
      `# of "${extension}" tokens: `,
      filter(tokens, matchesProperty(`extensions.${extension}`, true)).length
    );
  });
})();
