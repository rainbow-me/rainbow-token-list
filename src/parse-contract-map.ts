import isEmpty from 'lodash/isEmpty';
import pick from 'lodash/pick';
import { resolve } from 'path';
import {
  CONTRACT_MAP_REPO,
  CONTRACT_MAP_OUTPUT_PATH,
  RawContractMapToken,
  RawContractMapTokenSchema,
  Token,
} from './constants';
import { fetchRepository } from './git';
import { parseJsonFile, validateTokenData } from './parser';

// the JSON file exported by `eth-contract-metadata` is keyed by token contract address
type RawContractMap = { [address: string]: RawContractMapToken };

export default async function parseContractMap(): Promise<Token[]> {
  // fetch the latest commit from `eth-contract-metadata` repo and save it to disk
  await fetchRepository(CONTRACT_MAP_REPO, CONTRACT_MAP_OUTPUT_PATH);

  // load contract map JSON file from directory
  const jsonFile = resolve(CONTRACT_MAP_OUTPUT_PATH, 'contract-map.json');
  const contractMap = await parseJsonFile<RawContractMap>(jsonFile);

  return (
    Object.keys(contractMap)
      .map(
        (address: string): RawContractMapToken => ({
          ...contractMap[address],
          address,
        })
      )
      // remove any unknown/undesirable keys from each token object.
      .map(token => pick(token, Object.keys(RawContractMapTokenSchema.shape)))
      // remove any tokens from the array if they contain null values for the
      // keys that we care about.
      .filter(token => Object.values(token).some(isEmpty))
      .map(validateTokenData)
  );
}
