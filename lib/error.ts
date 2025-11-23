import type { z, ZodObject } from "zod";
import type { DeepNonNullable } from "./field";

export const errorChain = <Schema extends ZodObject>(
  issues: ReadonlyArray<z.core.$ZodIssue> | undefined
): ErrorChainFromSchema<Schema> =>
  new Proxy({}, { get: (_, k) => getErrorByPath(issues, [k]) }) as any;

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

      const matched = issues.find((x) => x.path.join(".") === path.join("."));

      if (!matched) {
        return;
      }

      if (typeof arg === "function") {
        return arg(matched);
      }

      return matched;
    },
  });

export interface ErrorGetter {
  /**
   * Get the Zod Issue
   */
  (): z.core.$ZodIssue | undefined;

  /**
   * Call the function on error and return its value
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

export interface ArrayErrorGetter<T> extends ErrorGetter {
  (index: number): T;
}

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

export type ErrorChainFromSchema<T extends ZodObject> = ErrorChain<
  DeepNonNullable<z.core.infer<T>>
>;
