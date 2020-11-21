import chroma from 'chroma-js';

const contrastThreshold = 2.5;

export function reduceArrayToObject(array: any[]) {
  return array.reduce((item, culm) => Object.assign(culm, item), {});
}

function contrast(color: string): number {
  return Number(chroma.contrast(color, '#ffffff').toFixed(2));
}

export function safeColor(color: string) {
  // Return totally chill colors that dont need to be messed with
  if (contrast(color) > contrastThreshold) return color;

  // True black is not safe, lets make it more chill
  if (chroma(color).hex() === '#000000') {
    return '#25292E';
  }

  // Mess with the color just enough to make it pass the chill contrastThreshold, but not too far past it.
  let newColor = color;
  while (contrast(newColor) <= contrastThreshold) {
    newColor = chroma(newColor)
      .darken(0.02)
      .saturate(0.02)
      .hex();
  }
  return newColor;
}
