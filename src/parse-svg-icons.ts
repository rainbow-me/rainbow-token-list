import { resolve } from 'path';
import { SVG_ICONS_REPO, SVG_ICONS_OUTPUT_PATH } from './constants';
import { fetchRepository } from './git';
import { parseJsonFile } from './parser';

export type SvgToken = { color: string; name: string; symbol: string };

export default async function parseSVGIconTokenFiles(): Promise<SvgToken[]> {
  // fetch the latest commit from `spothq/cryptocurrency-icons` repo and save it to disk
  await fetchRepository(SVG_ICONS_REPO, SVG_ICONS_OUTPUT_PATH);

  // load svg manifest JSON file from directory
  const jsonFile = resolve(SVG_ICONS_OUTPUT_PATH, 'manifest.json');
  return parseJsonFile<SvgToken[]>(jsonFile);
}
