import fetch from 'node-fetch';
import { TOKEN_LISTS, TokenListEnum, TokenListEnumSchema } from './constants';
import { reduceArrayToObject } from './utils';

interface Token {
  address?: string | null;
}

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

export default async function parseTokenLists() {
  const listsArray = await Promise.all(
    TokenListEnumSchema.options.map(
      async (list: TokenListEnum): Promise<TokenListStoreRecordType> => {
        return new Promise(async (resolve, reject) =>
          // fetch the TokenList from remote uri
          fetch(TOKEN_LISTS[list])
            .then((res) => res.json())
            .then(({ tags, tokens }) => {
              tokens = listFilters.has(list)
                ? listFilters.get(list)?.(tokens)
                : tokens;

              const tokensByAddress = new Map<string, Token>(
                tokens.map((token: Token) => [
                  token.address?.toLowerCase(),
                  token,
                ])
              );
              resolve({ [list]: { tags, tokens, tokensByAddress } });
            })
            .catch(reject)
        );
      }
    )
  );

  return reduceArrayToObject(listsArray);
}
