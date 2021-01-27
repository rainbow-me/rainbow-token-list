#!/usr/bin/env node

import { getAddress } from '@ethersproject/address';
import compact from 'lodash/compact';
import filter from 'lodash/filter';
import find from 'lodash/find';
import keyBy from 'lodash/keyBy';
import matchesProperty from 'lodash/matchesProperty';
import merge from 'lodash/merge';
import pick from 'lodash/pick';
import some from 'lodash/some';
import uniq from 'lodash/uniq';
import { resolve } from 'path';
import { Token, TokenExtensionsType, TokenListEnumSchema } from './constants';
import parseEthereumLists from './parse-ethereum-lists';
import parseOverrideFile from './parse-overrides';
import parseContractMap from './parse-contract-map';
import parseSVGIconTokenFiles from './parse-svg-icons';
import parseTokenLists from './parse-token-lists';
import { deeplyTrimAllTokenStrings, sortTokens, writeToDisk } from './parser';

import * as Types from './constants';
export { Types };

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

console.log('🌈️ building the rainbow token list');

function normalizeList(list: any[]) {
  return keyBy(list, ({ address }) => getAddress(address));
}

// Entry point
(async function() {
  const contractMapTokens = await parseContractMap();
  const [
    uniqueEthereumListTokens,
    duplicateEthereumListTokens,
  ] = await parseEthereumLists();
  const rainbowOverrides = await parseOverrideFile();
  const svgIcons = await parseSVGIconTokenFiles();
  const tokenListTokens: any = await parseTokenLists();
  const { coingecko, ...preferredTokenLists } = tokenListTokens;

  const sources = {
    default: [
      duplicateEthereumListTokens,
      uniqueEthereumListTokens,
      contractMapTokens,
      coingecko.tokens.flat(),
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
      return getAddress(address) === getAddress(tokenAddress);
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
      } else if (listNames.includes(TokenListEnumSchema.enum.kleros)) {
        return find(lists.kleros.tokens, matchToken);
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
        const logoData = svgIcons.find(item => item.symbol === symbol);
        color = logoData?.color;
      }

      const extensions: TokenExtensionsType = {
        color: overrideToken?.color || color,
        isRainbowCurated: overrideToken?.isCurated ? true : undefined,
        isVerified: isVerified || overrideToken?.isCurated ? true : undefined,
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
      name: 'Rainbow Token List',
      timestamp: new Date().toISOString(),
      logoURI: 'https://avatars0.githubusercontent.com/u/48327834?s=200&v=4',
      version: {
        major: 1,
        minor: 2,
        patch: 1,
      },
      keywords: ['rainbow'],
      tokens,
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
})();
