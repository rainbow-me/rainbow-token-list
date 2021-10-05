import { promises as fs } from 'fs';
import { tmpdir } from 'os';
import { resolve } from 'path';
import getSVGColors from 'get-svg-colors';
import compact from 'lodash/compact';
import unionBy from 'lodash/unionBy';
import makeColorMoreChill from 'make-color-more-chill';
import { fetchRepository } from './git';
import { parseJsonFile } from './parser';

export type SvgToken = { color: string; name?: string; symbol: string };

const SVG_ORIGINALS_REPO = 'spothq/cryptocurrency-icons';
const SVG_ORIGINALS_OUTPUT_PATH = resolve(tmpdir(), SVG_ORIGINALS_REPO);

const SVG_OVERRIDES_REPO = 'mikedemarais/react-coin-icon/assets/overrides';
const SVG_OVERRIDES_OUTPUT_PATH = resolve(tmpdir(), SVG_OVERRIDES_REPO);

async function parseOriginalSVGIcons() {
  // fetch the latest commit from `spothq/cryptocurrency-icons` repo and save it to disk
  await fetchRepository(SVG_ORIGINALS_REPO, SVG_ORIGINALS_OUTPUT_PATH);
  // load svg manifest JSON file from directory
  const jsonFile = resolve(SVG_ORIGINALS_OUTPUT_PATH, 'manifest.json');
  return parseJsonFile<SvgToken[]>(jsonFile);
}

async function parseOverrideSVGIcons() {
  // fetch the latest commit from `mikedemarais/react-coin-icons` repo and save it to disk
  await fetchRepository(SVG_OVERRIDES_REPO, SVG_OVERRIDES_OUTPUT_PATH);
  const files = await fs.readdir(SVG_OVERRIDES_OUTPUT_PATH);

  return files.reduce<Promise<any[]>>(async (svgTokens, file) => {
    const svgPath = resolve(SVG_OVERRIDES_OUTPUT_PATH, file);
    const svg = await fs.readFile(svgPath, 'utf8');

    // Attempt to get SVG's "color" by reading it's first "fill"
    // value (which is usually the icon's background).
    const fillColor = getSVGColors(svg).fills[0];

    let svgToken = undefined;
    if (fillColor) {
      svgToken = {
        color: makeColorMoreChill(fillColor.hex().toLowerCase()),
        symbol: file.split('.')[0].toUpperCase(),
      };
    } else {
      // eslint-disable-next-line no-console
      console.error(
        `Couldn't derive color from the "rainbow override" SVG file: \`${file}\``
      );
    }

    return Promise.resolve(compact([...(await svgTokens), svgToken]));
  }, Promise.resolve([]));
}

export default async function parseSVGIconTokenFiles(): Promise<SvgToken[]> {
  const originals = await parseOriginalSVGIcons();
  const overrides = await parseOverrideSVGIcons();

  return unionBy(originals, overrides, 'symbol');
}
