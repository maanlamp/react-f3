/**
 * Whether these keys are exactly `0` through `n - 1`.
 *
 * `Object.keys` lists array-index keys first, in ascending numeric
 * order, so comparing each key against its own position is enough to
 * rule out both gaps and non-canonical numbers like `"01"`.
 */
const isDense = (keys: ReadonlyArray<string>) =>
  keys.length > 0 && keys.every((key, i) => key === String(i));

/**
 * Turns the parsed tree into the values a schema sees: groups keyed
 * by a full run of indices become arrays, everything else becomes an
 * ordinary object.
 *
 * The tree is grown on null-prototype objects, so that a field named
 * `__proto__` or `constructor` writes an own property instead of
 * reaching `Object.prototype`. `Object.fromEntries` keeps that true
 * here: it defines properties, where assigning would run the
 * inherited setter it was avoiding in the first place.
 */
const normalise = (value: any): any => {
  if (
    value === null ||
    typeof value !== "object" ||
    Object.getPrototypeOf(value) !== null
  ) {
    return value;
  }

  const keys = Object.keys(value);
  const entries = keys.map((key) => [key, normalise(value[key])] as const);

  return isDense(keys)
    ? entries.map(([, member]) => member)
    : Object.fromEntries(entries);
};

/**
 * Expands a `FormData` into the nested object a schema can parse, by
 * splitting each entry's name on `.`.
 *
 * A group of segments that counts from `0` without gaps becomes an
 * array; anything else becomes an object, numbers included. Removing
 * the middle of a list therefore yields `{ "0": …, "2": … }` rather
 * than an array with a hole in it, which no schema can parse and
 * which quietly renumbers the fields around it. Schemas that outlive
 * a removal want `z.record`.
 *
 * A name used by more than one input keeps every value, as a
 * checkbox group does. One input still yields one value, because
 * nothing in `FormData` distinguishes a group of one from a plain
 * field; name the inputs `hobbies.0`, `hobbies.1` and so on where
 * the schema needs an array either way.
 *
 * Values are always strings or `File`s, as that is all `FormData`
 * holds; coercing them is the schema's job.
 *
 * @example
 * // name="address.street", name="tags.0", name="tags.1"
 * { address: { street: "..." }, tags: ["...", "..."] }
 */
export const parseFormData = (data: FormData): unknown => {
  const parsed: any = Object.create(null);

  for (const key of new Set(data.keys())) {
    const values = data.getAll(key);
    const chunks = key.split(".");
    let target = parsed;

    while (chunks.length > 1) {
      const chunk = chunks.shift()!;
      target[chunk] ??= Object.create(null);
      target = target[chunk];
    }

    target[chunks.shift()!] = values.length > 1 ? values : values[0];
  }

  return normalise(parsed);
};
