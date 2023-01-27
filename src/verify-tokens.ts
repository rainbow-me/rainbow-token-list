import { request } from 'undici';
import { Token } from './constants';

interface TokenWithMarketInfo extends Token {
  marketCap: Number;
  volume24h: Number;
  lastUpdatedAt: Number;
}

/**
 * verifyTokens will consider a token as verified if it meets certain criteria
 * @param tokens
 */
export async function verifyTokens(tokens: Token[]): Promise<Token[]> {
  const tokensWithMarketInfo = await getTokensWithMarketInfo(tokens);

  const meetsMarketCap = (token: TokenWithMarketInfo) =>
    token.marketCap >= 10_000_000;

  return tokensWithMarketInfo.filter(meetsMarketCap);
}

async function getTokensWithMarketInfo(
  tokens: Token[]
): Promise<TokenWithMarketInfo[]> {
  const addressToCoingeckoId = new Map<string, string>();

  const { statusCode, body } = await request(
    'https://api.coingecko.com/api/v3/coins/list?include_platform=true&asset_platform_id=ethereum',
    {
      headers: {
        'User-Agent': 'undici',
      },
    }
  );
  if (statusCode !== 200) {
    throw new Error('failed to get coingecko ids');
  }

  const coingeckoTokens: any = await body.json();
  for (const token of coingeckoTokens) {
    const tokenAddress = token?.platforms?.ethereum ?? '';
    const tokenCoingeckoId = token?.id;

    if (tokenAddress !== '') {
      addressToCoingeckoId.set(tokenAddress.toLowerCase(), tokenCoingeckoId);
    }
  }
  const coingeckoIdToToken = new Map<string, TokenWithMarketInfo>();

  for (const token of tokens) {
    const coingeckoId =
      addressToCoingeckoId.get(token?.address?.toLowerCase()) ?? '';

    if (coingeckoId === '') {
      continue;
    }

    coingeckoIdToToken.set(coingeckoId, {
      lastUpdatedAt: 0,
      marketCap: 0,
      volume24h: 0,
      ...token,
    });
  }

  const coingeckoIdsToCheck = Array.from(coingeckoIdToToken.keys());
  const idsPerBatch = 500;

  const batches = [];
  for (let i = 0; i < coingeckoIdsToCheck.length; i += idsPerBatch) {
    batches.push(coingeckoIdsToCheck.slice(i, i + idsPerBatch));
  }

  for (const batch of batches) {
    const ids = batch.join(',');
    const { body, statusCode } = await request(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_last_updated_at=true&include_market_cap=true&include_24hr_vol=true`,
      {
        headers: {
          'User-Agent': 'undici',
        },
      }
    );
    if (statusCode !== 200) {
      throw new Error('failed to get market information for tokens');
    }
    const coingeckoTokens: Record<
      string,
      {
        usd_market_cap: number;
        usd_24h_vol: number;
        last_updated_at: number;
      }
    > = await body.json();

    for (const [coingeckoId, coingeckoToken] of Object.entries(
      coingeckoTokens
    )) {
      const existingToken = coingeckoIdToToken.get(coingeckoId);
      if (!existingToken) {
        continue;
      }
      existingToken.marketCap = coingeckoToken?.usd_market_cap ?? 0;
      existingToken.volume24h = coingeckoToken?.usd_24h_vol ?? 0;
      existingToken.lastUpdatedAt = coingeckoToken?.last_updated_at ?? 0;

      coingeckoIdToToken.set(coingeckoId, existingToken);
    }
  }

  return Array.from(coingeckoIdToToken.values());
}
