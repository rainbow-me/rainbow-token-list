#!/usr/bin/env node

/* eslint-disable no-console */
import { resolve } from 'path';
import { getAddress } from '@ethersproject/address';
import {
  compact,
  filter,
  find,
  keyBy,
  matchesProperty,
  merge,
  pick,
  some,
  toLower,
  uniq,
} from 'lodash';
import { Token, TokenExtensionsType, TokenListEnumSchema } from './constants';
import * as Types from './constants';
import parseContractMap from './parse-contract-map';
import parseEthereumLists from './parse-ethereum-lists';
import parseOverrideFile from './parse-overrides';
import parseScamsFile from './parse-scams';
import parseSVGIconTokenFiles from './parse-svg-icons';
import parseTokenLists from './parse-token-lists';
import { deeplyTrimAllTokenStrings, sortTokens, writeToDisk } from './parser';

export { Types };

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

console.log('🌈️ building the rainbow token list');

function normalizeList(list: any[]) {
  return keyBy(list, ({ address }) => getAddress(address));
}

// Entry point
(async function () {
  const p1 = parseContractMap();
  const p2 = parseEthereumLists();
  const p3 = parseOverrideFile();
  const p4 = parseScamsFile();
  const p5 = parseSVGIconTokenFiles();
  const p6 = parseTokenLists();

  const [
    contractMapTokens,
    [uniqueEthereumListTokens, duplicateEthereumListTokens],
    rainbowOverrides,
    rainbowScams,
    svgIcons,
    tokenListTokens,
  ] = await Promise.all([p1, p2, p3, p4, p5, p6]);
  const { coingecko, ...preferredTokenLists } = tokenListTokens;
  const sources = {
    default: [
      duplicateEthereumListTokens,
      uniqueEthereumListTokens,
      contractMapTokens,
      coingecko.tokens.flat(),
      rainbowScams,
    ].map(normalizeList),
    preferred: [
      Object.values(preferredTokenLists)
        .map(({ tokens }: any) => tokens)
        .flat(),
    ].map(normalizeList),
  };

  const defaultSources: any = merge({}, ...sources.default);
  const allKnownTokenAddresses: any = uniq(
    compact([
      ...sources.default.map(Object.keys).flat(),
      ...sources.preferred.map(Object.keys).flat(),
    ]).map(getAddress)
  );

  function resolveTokenInfo(tokenAddress: string) {
    function matchToken({ address }: Token): boolean {
      return toLower(address) === toLower(tokenAddress);
    }

    const lists = pick(
      tokenListTokens,
      Object.keys(tokenListTokens).filter((list: any) =>
        some(tokenListTokens[list].tokens, matchToken)
      )
    );

    if (Object.keys(lists).length === 1) {
      return find(lists[Object.keys(lists)[0]].tokens, matchToken);
    } else if (Object.keys(lists).length > 1) {
      const listNames = Object.keys(lists);
      if (listNames.includes(TokenListEnumSchema.enum.synthetix)) {
        return find(lists.synthetix.tokens, matchToken);
      } else if (listNames.includes(TokenListEnumSchema.enum.aave)) {
        return find(lists.aave.tokens, matchToken);
      } else if (listNames.includes(TokenListEnumSchema.enum.roll)) {
        return find(lists.roll.tokens, matchToken);
      } else if (listNames.includes(TokenListEnumSchema.enum.dharma)) {
        return find(lists.dharma.tokens, matchToken);
      } else if (listNames.includes(TokenListEnumSchema.enum.wrapped)) {
        return find(lists.wrapped.tokens, matchToken);
      } else if (listNames.includes(TokenListEnumSchema.enum.coingecko)) {
        return find(lists.coingecko.tokens, matchToken);
      }
    }

    return defaultSources[tokenAddress];
  }

  function buildTokenList() {
    return allKnownTokenAddresses.map((tokenAddress: string) => {
      const token = resolveTokenInfo(tokenAddress);
      const overrideToken = rainbowOverrides[tokenAddress];
     
      let { chainId = 1, color, decimals, name, shadowColor, symbol } = token;

      const isVerified = sources.preferred
        .map(Object.keys)
        .flat()
        .includes(tokenAddress);

      if (isVerified) {
        const logoData = svgIcons.find((item) => item.symbol === symbol);
        color = logoData?.color;
      }

      const extensions: TokenExtensionsType = {
        color: overrideToken?.color || color,
        isRainbowCurated: overrideToken?.isCurated ? true : undefined,
        isScam: overrideToken?.isScam || token?.extensions?.isScam || undefined,
        isVerified:
          isVerified || overrideToken?.isCurated
            ? true
            : !!overrideToken?.isVerified || undefined,
        shadowColor: overrideToken?.shadowColor || shadowColor,
      };

      return deeplyTrimAllTokenStrings({
        address: tokenAddress,
        chainId,
        decimals,
        name: overrideToken?.name || name,
        symbol: overrideToken?.symbol || symbol,
        ...(compact(Object.values(extensions)).length
          ? { extensions }
          : undefined),
      });
    });
  }

  const tokens = await sortTokens(buildTokenList());

  await writeToDisk(
    {
      keywords: ['rainbow'],
      logoURI: 'https://avatars0.githubusercontent.com/u/48327834?s=200&v=4',
      name: 'Rainbow Token List',
      timestamp: new Date().toISOString(),
      tokens,
      version: {
        major: 1,
        minor: 2,
        patch: 1,
      },
    },
    resolve(process.cwd(), './output'),
    'rainbow-token-list.json'
  );

  console.log(
    '# of "isRainbowCurated" tokens: ',
    filter(tokens, matchesProperty('extensions.isRainbowCurated', true)).length
  );
  console.log(
    '# of "isVerified" tokens: ',
    filter(tokens, matchesProperty('extensions.isVerified', true)).length
  );
  console.log(
    '# of "isScam" tokens: ',
    filter(tokens, matchesProperty('extensions.isScam', true)).length
  );
})();
