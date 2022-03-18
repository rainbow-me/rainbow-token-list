import fetch from 'node-fetch';
import { TOKEN_LISTS, TokenListEnum, TokenListEnumSchema } from './constants';
import { reduceArrayToObject } from './utils';

export interface TokenListStore {
  tags?: string[];
  tokens?: {
    address?: string | null;
  };
}
export type TokenListStoreRecordType = Record<string, TokenListStore>;

const omitTokenWithTag = (tokens: any[], tag: string) =>
  tokens.filter(({ tags = [] }: TokenListStore) => !tags.includes(tag));

const pickTokenWithTag = (tokens: any[], tag: string) =>
  tokens.filter(({ tags = [] }: TokenListStore) => tags.includes(tag));

const { aave, roll } = TokenListEnumSchema.enum;

export default async function parseTokenLists() {
  const listsArray = await Promise.all(
    TokenListEnumSchema.options.map(
      async (list: TokenListEnum): Promise<TokenListStoreRecordType> => {
        return new Promise(async (resolve, reject) =>
          // fetch the TokenList from remote uri
          fetch(TOKEN_LISTS[list])
            .then((res) => res.json())
            .then(({ tags, tokens }) => resolve({ [list]: { tags, tokens } }))
            .catch(reject)
        );
      }
    )
  );

  return reduceArrayToObject(
    listsArray.map((list: any) => {
      const listName = Object.keys(list)[0];
      const newList = { ...list };

      if (listName === roll) {
        newList[roll].tokens = omitTokenWithTag(newList[roll].tokens, 'bases');
      }

      if (listName === aave) {
        newList[aave].tokens = [
          ...pickTokenWithTag(newList[aave].tokens, 'atokenv1'),
          ...pickTokenWithTag(newList[aave].tokens, 'atokenv2'),
        ];
      }

      return newList;
    })
  );
}
