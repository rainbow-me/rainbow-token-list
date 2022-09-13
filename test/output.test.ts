import { tokens } from '../output/rainbow-token-list.json';

describe('rainbow-token-list.json', () => {
  it('has an array of tokens', () => {
    expect(Array.isArray(tokens)).toEqual(true);
    expect(tokens.length).toBeGreaterThan(100);
  });
  it('has at least one L2 tokens', () => {
    const l2Tokens = tokens.filter(({ chainId }) => chainId !== 1);
    expect(Array.isArray(l2Tokens)).toEqual(true);
    expect(l2Tokens.length).toBeGreaterThanOrEqual(1);
  });
});
