import type z from "zod";
import type { ZodObject } from "zod";

export type Primitive =
  | string
  | number
  | boolean
  | bigint
  | symbol
  | undefined
  | null;

export type DeepNonNullable<T> = T extends Primitive | Date | File
  ? NonNullable<T>
  : T extends {}
  ? { [K in keyof T]-?: DeepNonNullable<T[K]> }
  : Required<T>;

/**
 * A leaf of the `fields` chain. Returns the `name` attribute for
 * this field, dot-separated: `"address.street"`.
 */
export type FieldGetter = () => string;

export type IsAny<T> = 0 extends 1 & T ? true : false;

/**
 * Maps an object type to a tree of {@link FieldGetter}s. Array
 * members take an index first, since each element needs its own
 * `name`.
 */
export type FieldChain<T extends object> = {
  [P in keyof T]: IsAny<T[P]> extends true
    ? FieldGetter
    : T[P] extends Array<any>
    ? (index: number) => FieldGetter
    : T[P] extends Date | File
    ? FieldGetter
    : T[P] extends object
    ? FieldChain<T[P]>
    : FieldGetter;
};

/**
 * The {@link FieldChain} for a schema, over its input type; the
 * shape the form submits, before any transforms.
 */
export type FieldChainFromSchema<T extends ZodObject> = FieldChain<
  DeepNonNullable<z.input<T>>
>;

/**
 * Builds the `fields` chain: an object shaped like `Schema` whose
 * leaves return the `name` attribute to put on an input.
 *
 * The names it produces are the paths `parseFormData` reads back,
 * which is what lets a flat `FormData` parse as a nested object.
 */
export const fieldChain = <
  Schema extends ZodObject
>(): FieldChainFromSchema<Schema> =>
  new Proxy({}, { get: (_, k) => getFieldName([k]) }) as any;

const getFieldName = (path: ReadonlyArray<keyof any>): any =>
  new Proxy(() => {}, {
    get: (_, k) => getFieldName([...path, k]),
    apply: (_, __, [arg]) => {
      if (typeof arg === "number") {
        return getFieldName([...path, arg]);
      }

      return path.map(String).join(".");
    },
  });
