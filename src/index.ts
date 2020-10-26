#!/usr/bin/env node

import { getAddress } from '@ethersproject/address';
import compact from 'lodash/compact';
import find from 'lodash/find';
import flattenDeep from 'lodash/flattenDeep';
import keyBy from 'lodash/keyBy';
import merge from 'lodash/merge';
import pick from 'lodash/pick';
import property from 'lodash/property';
import some from 'lodash/some';
import uniq from 'lodash/uniq';
import values from 'lodash/values';
import { resolve } from 'path';
import { Token, TokenListEnumSchema } from './constants';
import parseEthereumLists from './parse-ethereum-lists';
import parseContractMap from './parse-contract-map';
import parseTokenLists from './parse-token-lists';
import { sortTokens, writeToDisk } from './parser';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

console.log('🌈️ building the rainbow token list');

const { aave, coingecko, dharma, roll, synthetix } = TokenListEnumSchema.enum;

const normalizeList = (list: any[]) =>
  keyBy(list, ({ address }) => getAddress(address));

(async function() {
  const [
    uniqueEthereumListTokens,
    duplicateEthereumListTokens,
  ] = await parseEthereumLists();
  const contractMapTokens = await parseContractMap();
  const tokenListTokens: any = await parseTokenLists();

  const allTokenListsFlattened = flattenDeep(
    values(tokenListTokens).map(property('tokens'))
  );

  const tokenListTokenAddresses = Object.keys(
    normalizeList(allTokenListsFlattened)
  );

  const normalizedDuplicateEthereumListTokens = normalizeList(
    duplicateEthereumListTokens
  );
  const normalizedUniqueEthereumListTokens = normalizeList(
    uniqueEthereumListTokens
  );
  const normalizedContractMap = normalizeList(contractMapTokens);

  const allKnownTokenAddresses: any[] = uniq(
    compact([
      ...Object.keys(normalizedDuplicateEthereumListTokens),
      ...Object.keys(normalizedUniqueEthereumListTokens),
      ...Object.keys(normalizedContractMap),
      ...tokenListTokenAddresses,
    ]).map(getAddress)
  );

  const defaultTokenDataSources = merge(
    normalizedDuplicateEthereumListTokens,
    normalizedUniqueEthereumListTokens,
    normalizedContractMap
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

    return defaultTokenDataSources[tokenAddress];
  }

  function buildTokenList() {
    return allKnownTokenAddresses.map(tokenAddress => {
      const token = resolveTokenInfo(tokenAddress);

      const isVerified = some(allTokenListsFlattened, [
        'address',
        tokenAddress,
      ]);

      const extensions = {
        is_verified: isVerified,
      };

      const { chainId = 1, decimals, name, symbol } = token;

      return {
        address: tokenAddress,
        chainId,
        decimals,
        extensions,
        name,
        symbol,
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
        patch: 0,
      },
      keywords: ['rainbow'],
      tokens: sortTokens(buildTokenList()),
    },
    resolve(process.cwd(), './output'),
    'rainbow-token-list.json'
  );
})();
