#!/usr/bin/env node

import { getAddress } from '@ethersproject/address';
import find from 'lodash/find';
import compact from 'lodash/compact';
import keyBy from 'lodash/keyBy';
import merge from 'lodash/merge';
import pick from 'lodash/pick';
import some from 'lodash/some';
import uniq from 'lodash/uniq';
import { resolve } from 'path';
import { Token, TokenInfoExtensions, TokenListEnumSchema } from './constants';
import parseEthereumLists from './parse-ethereum-lists';
import parseOverrideFile from './parse-overrides';
import parseContractMap from './parse-contract-map';
import parseSVGIconTokenFiles from './parse-svg-icons';
import parseTokenLists from './parse-token-lists';
import { sortTokens, writeToDisk } from './parser';

import * as Types from './constants';
export { Types };

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

console.log('🌈️ building the rainbow token list');

const { aave, coingecko, dharma, roll, synthetix } = TokenListEnumSchema.enum;

function normalizeList(list: any[]) {
  return keyBy(list, ({ address }) => getAddress(address));
}

// Entry point
(async function() {
  const [
    uniqueEthereumListTokens,
    duplicateEthereumListTokens,
  ] = await parseEthereumLists();
  const contractMapTokens = await parseContractMap();
  const svgIcons = await parseSVGIconTokenFiles();
  const tokenListTokens: any = await parseTokenLists();
  const rainbowOverrides = await parseOverrideFile();

  const sources = {
    default: [
      duplicateEthereumListTokens,
      uniqueEthereumListTokens,
      contractMapTokens,
    ].map(normalizeList),
    preferred: [
      Object.values(tokenListTokens)
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
      if (listNames.includes(synthetix)) {
        return find(lists.synthetix.tokens, matchToken);
      } else if (listNames.includes(aave)) {
        return find(lists.aave.tokens, matchToken);
      } else if (listNames.includes(roll)) {
        return find(lists.roll.tokens, matchToken);
      } else if (listNames.includes(dharma)) {
        return find(lists.dharma.tokens, matchToken);
      } else if (listNames.includes(coingecko)) {
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

      const extensions: TokenInfoExtensions = {
        color: overrideToken?.color || color,
        isRainbowCurated: !!overrideToken ? true : undefined,
        isVerified: isVerified ? true : undefined,
        shadowColor: overrideToken?.shadowColor || shadowColor,
      };

      return {
        address: tokenAddress,
        chainId,
        decimals,
        name: overrideToken?.name || name,
        symbol: overrideToken?.symbol || symbol,
        ...(compact(Object.values(extensions)).length
          ? { extensions }
          : undefined),
      };
    });
  }

  await writeToDisk(
    {
      name: 'Rainbow Token List',
      timestamp: new Date().toISOString(),
      logoURI: 'https://avatars0.githubusercontent.com/u/48327834?s=200&v=4',
      version: {
        major: 1,
        minor: 0,
        patch: 4,
      },
      keywords: ['rainbow'],
      tokens: sortTokens(buildTokenList()),
    },
    resolve(process.cwd(), './output'),
    'rainbow-token-list.json'
  );
})();
