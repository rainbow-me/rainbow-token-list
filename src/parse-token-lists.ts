import fetch from 'node-fetch';
import { TOKEN_LISTS } from './constants';

function fetchTokenList(tokenListName: string) {
  return new Promise(async (resolve, reject) => {
    const uri = TOKEN_LISTS[tokenListName];

    // fetch the TokenList from remote uri
    const tokenList = await fetch(uri)
      .then(res => res.json())
      .then(({ tags, tokens }) => ({ tags, tokens }))
      .catch(error => {
        reject();
        if (error && error.code !== 'ENOENT') {
          throw error;
        }
      });
    console.log('tokenList', tokenList);
    return resolve({ [tokenListName]: tokenList });
  });
}

export default function parseTokenLists() {
  return Promise.all(Object.keys(TOKEN_LISTS).map(fetchTokenList));
}
