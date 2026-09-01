/**
 * Matches a path segment that addresses an array index.
 */
export const DIGITS = /^\d+$/;

/**
 * Rebuilds the parsed tree on ordinary objects.
 *
 * The tree is grown on null-prototype objects, so that a field named
 * `__proto__` or `constructor` writes an own property instead of
 * reaching `Object.prototype`. `Object.fromEntries` keeps that true
 * here: it defines properties, where assigning would run the
 * inherited setter it was avoiding in the first place.
 */
const toPlainObjects = (value: any): any =>
  Array.isArray(value)
    ? value.map(toPlainObjects)
    : value !== null &&
      typeof value === "object" &&
      Object.getPrototypeOf(value) === null
    ? Object.fromEntries(
        Object.entries(value).map(([k, v]) => [k, toPlainObjects(v)])
      )
    : value;

/**
 * Expands a `FormData` into the nested object a schema can parse,
 * by splitting each entry's name on `.`. A numeric segment becomes
 * an array index, anything else an object key.
 *
 * Values are always strings or `File`s, as that is all `FormData`
 * holds; coercing them is the schema's job.
 *
 * @example
 * // name="address.street", name="tags.0"
 * { address: { street: "..." }, tags: ["..."] }
 */
export const parseFormData = (data: FormData): unknown => {
  const parsed: any = Object.create(null);

  for (const [k, v] of data.entries()) {
    const path = k.split(".");
    let chunks = path.slice();
    let target = parsed;

    while (chunks.length > 1) {
      const chunk = chunks.shift()!;
      if (DIGITS.test(chunks[0])) {
        target[chunk] ??= [];
      } else {
        target[chunk] ??= Object.create(null);
      }
      target = target[chunk];
    }

    target[chunks.shift()!] = v;
  }

  return toPlainObjects(parsed);
};
