import { resolve } from 'path';
import { getAddress } from '@ethersproject/address';
import mapKeys from 'lodash/mapKeys';
import { ChainIDEnumSchema } from './constants';
import { parseJsonFile } from './parser';

export type OverrideToken = {
  color?: string;
  decimals?: number;
  isCurated?: boolean;
  isVerified?: boolean;
  name?: string;
  symbol?: string;
  shadowColor?: string;
};

export type OverrideFile = { [address: string]: OverrideToken };

type OverrideMap = { [chainID: string]: OverrideFile };

/**
 * Loop over ChainIDEnumSchema to get multi chain token override
 *
 * @returns Promise<OverrideMap>
 */
export default async function parseOverrideFiles(): Promise<OverrideMap> {
  return new Promise((res) => {
    let overrides: OverrideMap = {};

    Object.entries(ChainIDEnumSchema).forEach(async ([chainName, chainId]) => {
      const jsonFile = resolve(process.cwd(), 'overrides', `${chainName}.json`);

      const tokenList = await parseJsonFile<OverrideFile>(jsonFile).then(
        (override) => {
          return mapKeys(override, (...args) => {
            if (args[1] === 'ETH') return args[1];
            return getAddress(args[1]);
          });
        }
      );
      overrides[chainId] = tokenList;
    });

    res(overrides);
  });
}
