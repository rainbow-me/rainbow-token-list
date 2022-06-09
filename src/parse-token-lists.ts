import { request } from 'undici';
import {
  Token,
  TOKEN_LISTS,
  TokenListEnum,
  TokenListEnumSchema,
} from './constants';
import { reduceArrayToObject } from './utils';

export interface TokenListStore {
  tags?: string[];
  tokensByAddress: Map<string, Token>;
  tokens?: Token[];
}
export type TokenListStoreRecordType = Record<string, TokenListStore>;

const omitTokenWithTag = (tokens: any[], tag: string) =>
  tokens.filter(({ tags = [] }: TokenListStore) => !tags.includes(tag));

const pickTokenWithTag = (tokens: any[], tag: string) =>
  tokens.filter(({ tags = [] }: TokenListStore) => tags.includes(tag));

const listFilters: Map<string, (tokens: Token[]) => Token[]> = new Map(
  Object.entries({
    aave: (tokens: Token[]) => [
      ...pickTokenWithTag(tokens, 'atokenv1'),
      ...pickTokenWithTag(tokens, 'atokenv2'),
    ],
    roll: (tokens: Token[]) => omitTokenWithTag(tokens, 'bases'),
  })
);

export default async function parseTokenLists(): Promise<
  Record<TokenListEnum, TokenListStore>
> {
  const listsArray = await Promise.all(
    Object.values(TokenListEnumSchema).map(
      async (list: TokenListEnumSchema): Promise<TokenListStoreRecordType> => {
        return new Promise(async (resolve, reject) => {
          const { body, statusCode } = await request(TOKEN_LISTS[list], {
            headers: {
              'User-Agent': 'undici',
            },
          });

          if (statusCode !== 200) {
            reject(`${TOKEN_LISTS[list]} returned ${statusCode} status`);
          }

          let { tags, tokens } = await body.json();
          tokens = listFilters.has(list)
            ? listFilters.get(list)?.(tokens)
            : tokens;

          const tokensByAddress = new Map<string, Token>(
            tokens.map((token: Token) => [token.address?.toLowerCase(), token])
          );
          resolve({ [list]: { tags, tokens, tokensByAddress } });
        });
      }
    )
  );

  return reduceArrayToObject(listsArray);
}
