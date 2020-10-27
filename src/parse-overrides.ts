import { resolve } from 'path';
import { parseJsonFile } from './parser';

export type OverrideToken = {
  color?: string;
  name?: string;
  symbol?: string;
  shadowColor?: string;
};

type OverrideFile = { [address: string]: OverrideToken };

export default async function parseOverrideFile(): Promise<OverrideFile> {
  // load svg manifest JSON file from directory
  const jsonFile = resolve(process.cwd(), 'rainbow-overrides.json');
  return parseJsonFile<OverrideFile>(jsonFile);
}
