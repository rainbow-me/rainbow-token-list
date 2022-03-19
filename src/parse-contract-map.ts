import { resolve } from 'path';
import isEmpty from 'lodash/isEmpty';
import {
  CONTRACT_MAP_OUTPUT_PATH,
  CONTRACT_MAP_REPO,
  RawContractMapTokenSchema,
  Token,
} from './constants';
import { fetchRepository } from './git';
import { parseJsonFile } from './parser';

// the JSON file exported by `eth-contract-metadata` is keyed by token contract address
type RawContractMap = { [address: string]: RawContractMapTokenSchema };

export default async function parseContractMap(): Promise<Token[]> {
  // fetch the latest commit from `eth-contract-metadata` repo and save it to disk
  await fetchRepository(CONTRACT_MAP_REPO, CONTRACT_MAP_OUTPUT_PATH);

  // load contract map JSON file from directory
  const jsonFile = resolve(CONTRACT_MAP_OUTPUT_PATH, 'contract-map.json');
  const contractMap = await parseJsonFile<RawContractMap>(jsonFile);

  return (
    Object.keys(contractMap)
      .map(
        (address: string): RawContractMapTokenSchema => ({
          ...contractMap[address],
          address,
        })
      )
      // // remove any unknown/undesirable keys from each token object.
      // .map((token) => pick(token, Object.keys(RawContractMapTokenSchema)))
      // remove any tokens from the array if they contain null values for the
      // keys that we care about.
      .filter((token) => Object.values(token).some(isEmpty)) as Token[]
  );
}
