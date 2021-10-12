import { tokens } from '../output/rainbow-token-list.json';

describe('rainbow-token-list.json', () => {
  it('has an array of tokens', () => {
    expect(Array.isArray(tokens)).toEqual(true);
    expect(tokens.length).toBeGreaterThan(100);
  });
});
