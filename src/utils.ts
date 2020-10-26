export function reduceArrayToObject(array: any[]) {
  return array.reduce((item, culm) => Object.assign(culm, item), {});
}
