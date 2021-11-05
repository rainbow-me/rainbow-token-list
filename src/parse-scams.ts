import { resolve } from 'path';
import { getAddress } from '@ethersproject/address';
import transform  from 'lodash/transform';
import { parseJsonFile } from './parser';

  export type ScamToken = {
    address?: string;
    decimals: number;
    isScam?: boolean;
    name?: string;
    symbol?: string;
  };

type ScamFile = { [address: string]: ScamToken };

export default async function parseScamsFile(): Promise<ScamFile> {
  const jsonFile = resolve(process.cwd(), 'rainbow-scams.json');
  return parseJsonFile<ScamFile>(jsonFile).then((scam) => {
    return transform(scam, (result: ScamFile, value, key) => {
        const checksumAddress = getAddress(key);
        const defaultTokenValues = { 
            address: checksumAddress,
            decimals: 18,
            extensions :{
                isScam: value.isScam,
            },
            name: 'Scam',
            symbol: 'SCAM'
        };
        result[checksumAddress] = defaultTokenValues;

    });
  });
}
