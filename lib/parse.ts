/**
 * Matches a path segment that addresses an array index.
 */
export const DIGITS = /^\d+$/;

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
  const parsed: any = {};

  for (const [k, v] of data.entries()) {
    const path = k.split(".");
    let chunks = path.slice();
    let target = parsed;

    while (chunks.length > 1) {
      const chunk = chunks.shift()!;
      if (DIGITS.test(chunks[0])) {
        target[chunk] ??= [];
      } else {
        target[chunk] ??= {};
      }
      target = target[chunk];
    }

    target[chunks.shift()!] = v;
  }

  return parsed;
};
