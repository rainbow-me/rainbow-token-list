#!/usr/bin/env node

import { getAddress } from '@ethersproject/address';
import parseEthereumLists from './parse-ethereum-lists';
import parseContractMap from './parse-contract-map';
// import parseTokenLists from './parse-token-lists';
import {
  fixDuplicates,
  resolveDeprecations,
  // sortTokens,
} from './parser';
import keyBy from 'lodash/keyBy';
import uniq from 'lodash/uniq';

import { Token } from './constants'


process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
// import { TokenListType } from './constants'

console.log('🌈️');

const normalizeList = (list: Token[]) => keyBy(list, ({ address }) => getAddress(address));

async function main() {
  const [
    uniqueEthereumListTokens,
    duplicateEthereumListTokens,
  ] = await parseEthereumLists()
    .then(resolveDeprecations)
    .then(fixDuplicates);

  const contractMapTokens = await parseContractMap();

  const normalizedUniqueEthereumListTokens = normalizeList(uniqueEthereumListTokens)
  const normalizedContractMapTokens = normalizeList(contractMapTokens);
  // .then((tokens: Token[]) => {
  //   return normalizeList(tokens);
  // });
  // const three = await parseTokenLists();
  console.log('contractMapTokens', typeof contractMapTokens, contractMapTokens);



  let allKnownTokenAddresses: string[] = uniq([
    ...Object.keys(normalizedUniqueEthereumListTokens),
    ...Object.keys(normalizedContractMapTokens),
  ]);


  // const filteredEthList = one.filter(token => {
  //   // console.log('token', token);
  //   return !token.duplicate;
  // })
  console.log('allKnownTokenAddresses', allKnownTokenAddresses);
  console.log('normalizedUniqueEthereumListTokens', normalizedUniqueEthereumListTokens.length);
  console.log('uniqueEthereumListTokens', uniqueEthereumListTokens.length);
  console.log('duplicateEthereumListTokens', duplicateEthereumListTokens.length);
    // .then(sortTokens);
  // console.log(
  //   'uniqueEthereumListTokens',
  //   uniqueEthereumListTokens.filter((item: Token) => {
  //     return item.symbol === 'HEX';
  //   })
  // );

  // console.log(
  //   'duplicateEthereumListTokens',
  //   duplicateEthereumListTokens.filter((item: Token) => {
  //     return item.symbol === 'HEX';
  //   })
  // );



  // console.log('contractMapTokens', two);
  // console.log('three', three[0]);
  // console.log('three', Object.values(three));
  // console.log('token lists count', three.length);
  // console.log('eth list count', one.length);
  // console.log('contract map count', two.length);

  // console.log('🌈️ done', [...one, ...two].length);

  // const finalRainbowTokenList = {
  //   tokens:
  // }
}

main();

// import { resolve } from 'path';
// import Listr, { ListrTask } from 'listr';
// import { keyBy, merge } from 'lodash';
// import {
//   fetchRepository,
//   fetchContractMapRepo,
//   fetchTokenLists,
//   lists,
//   fetchSVGIconsRepo,
//   fetchEthereumListsRepo
// } from './git';
// import {
//   addUniqueId,
//   checkNetworks,
//   createOutputFolder,
//   fixDuplicates,
//   parseContractMapTokenFiles,
//   parseEthereumListTokenFiles,
//   resolveDeprecations,
//   sortTokens,
//   writeToDisk
// } from './parser';
// import {
//   NETWORKS,
//   CONTRACT_MAP_OUTPUT_PATH,
//   TOKEN_LISTS,
//   ETHEREUM_LISTS_OUTPUT_PATH,
//   ETHEREUM_LISTS_REPO,
//   Token
// } from './constants';
// import { uriToHttp } from './utils';

// export const parseTokens = async (): Promise<void> => {
//   const listr = new Listr<{ tokens: { [network: string]: Token[] } }>([
//     {
//       title: 'Fetching upstream Token Lists',
//       task: () => fetchTokenLists()
//     },

//     // {
//     //   title: 'Fetching `ethereum-lists/tokens` repository',
//     //   task: () => fetchEthereumListsRepo()
//     // },

//     // {
//     //   title: 'Fetching `eth-contract-metadata` repository',
//     //   task: () => fetchContractMapRepo()
//     // },

//     // {
//     //   title: 'Fetching `spothq/cryptocurrency-icons` repository',
//     //   task: () => fetchSVGIconsRepo()
//     // },

//     {
//       title: 'Parsing token files',
//       task: async (context) => {
//         const ethTokens = await parseEthereumListTokenFiles(
//           resolve(ETHEREUM_LISTS_OUTPUT_PATH, 'tokens', 'eth'),
//         )
// .then(resolveDeprecations)
// .then(fixDuplicates)
// .then(sortTokens);

//         const contractTokens = await parseContractMapTokenFiles(
//           resolve(CONTRACT_MAP_OUTPUT_PATH),
//           options.exclude
//         );

//         context.tokens = [...ethTokens, ...contractTokens];
//         Promise.resolve();
//       },
//     },
//     {
//       title: 'logging lists',
//       task: () => {

//         console.log('lists', lists);
//       },
//     },

//     {
//       title: 'Writing output file(s) to disk',
//       task: (context) => {
//         const tokens = Object.keys(context.tokens);
//         writeToDisk(tokens, resolve(process.cwd(), 'output'), 'eth.json');

//         return new Listr([
//           {
//             title: 'Creating output folder',
//             task: () => createOutputFolder(path)
//           },
//           ...tasks
//         ]);
//       }
//     }
//   ]);

//   await listr.run({
//     tokens: {}
//   });
// };
