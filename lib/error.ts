import type { z, ZodObject } from "zod";
import type { DeepNonNullable } from "./field";

/**
 * Builds the `errors` chain: an object shaped like `Schema` whose
 * leaves are {@link ErrorGetter}s over `issues`.
 *
 * An issue belongs to a leaf when its `path` matches the path walked
 * to reach that leaf, so `errors.address.street()` returns the issue
 * whose path is `["address", "street"]`.
 */
export const errorChain = <Schema extends ZodObject>(
  issues: ReadonlyArray<z.core.$ZodIssue> | undefined
): ErrorChainFromSchema<Schema> =>
  new Proxy({}, { get: (_, k) => getErrorByPath(issues, [k]) }) as any;

/**
 * One node of the {@link errorChain}. Reading a property walks
 * deeper into the path; calling it resolves the path against
 * `issues`.
 */
export const getErrorByPath = (
  issues: ReadonlyArray<z.core.$ZodIssue> | undefined,
  path: ReadonlyArray<keyof any>
): any =>
  new Proxy(() => {}, {
    get: (_, k) => getErrorByPath(issues, [...path, k]),
    apply: (_, __, [arg]) => {
      if (typeof arg === "number") {
        return getErrorByPath(issues, [...path, arg]);
      }

      if (!issues?.length) {
        return;
      }

      const matched = issues.find(
        (issue) => issue.path.join(".") === path.join(".")
      );

      if (!matched) {
        return;
      }

      if (typeof arg === "function") {
        return arg(matched);
      }

      return matched;
    },
  });

/**
 * A leaf of the `errors` chain.
 */
export interface ErrorGetter {
  /**
   * The issue at this path, or `undefined` when there is none.
   */
  (): z.core.$ZodIssue | undefined;

  /**
   * Calls `render` with the issue at this path and returns its
   * result, or `undefined` when there is no issue. Renders nothing
   * for a valid field.
   */
  <
    Fn extends (
      issue: z.core.$ZodIssue,
      ...issues: ReadonlyArray<z.core.$ZodIssue>
    ) => any
  >(
    render: Fn
  ): ReturnType<Fn> | undefined;
}

/**
 * A leaf of the `errors` chain that stands for an array. Call it
 * with an index to address one element.
 */
export interface ArrayErrorGetter<T> extends ErrorGetter {
  (index: number): T;
}

/**
 * Maps an object type to a tree of {@link ErrorGetter}s. Nested
 * objects stay walkable and are getters themselves, so a whole
 * subtree can carry an issue of its own.
 */
export type ErrorChain<T extends object> = {
  [P in keyof T]: T[P] extends Array<any>
    ? ArrayErrorGetter<
        ErrorChain<T[P][0]> extends string
          ? ErrorGetter
          : ErrorChain<T[P][0]> & ErrorGetter
      >
    : T[P] extends object
    ? ErrorChain<T[P]> & ErrorGetter
    : ErrorGetter;
};

/**
 * The {@link ErrorChain} for a schema, over its output type.
 */
export type ErrorChainFromSchema<T extends ZodObject> = ErrorChain<
  DeepNonNullable<z.core.infer<T>>
>;
