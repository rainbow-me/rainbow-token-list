import { resolve } from 'path';
import { getAddress } from '@ethersproject/address';
import mapKeys from 'lodash/mapKeys';
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

type OverrideFile = { [address: string]: OverrideToken };

export default async function parseOverrideFile(): Promise<OverrideFile> {
  // load svg manifest JSON file from directory
  const jsonFile = resolve(process.cwd(), 'rainbow-overrides.json');
  return parseJsonFile<OverrideFile>(jsonFile).then((override) => {
    return mapKeys(override, (...args) => {
      if (args[1] === 'ETH') return args[1];
      return getAddress(args[1]);
    });
  });
}
