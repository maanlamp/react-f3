import { useCallback, useEffect, useState } from "react";
import type { ZodObject, ZodRawShape } from "zod";
import type { UseFormReturn } from "./use-form";

type Falsy<T> = T | false | 0 | "" | null | undefined | 0n;

const rows = (size: number) =>
  Array.from({ length: size }, () => crypto.randomUUID());

/**
 * Tracks a repeatable group of fields; the "add another one" list.
 *
 * Holds a list of ids rather than values, which you render into
 * field names. Because the id of a row never changes, removing one
 * doesn't renumber, and so doesn't shuffle the values of the rows
 * around it the way an index would. Resetting the form restores the
 * initial rows.
 *
 * @param defaultValue Anything with a `length`, usually the data the
 * rows are rendered from, giving the number of rows to start with. A
 * falsy value starts empty, which makes it safe to pass a query that
 * hasn't resolved yet.
 *
 * @example
 * const todos = useFieldset(form, defaults);
 *
 * todos.fields.map((id) => (
 *   <input key={id} name={form.fields.todos[id].title()} />
 * ));
 */
export const useFieldset = <
  Shape extends ZodRawShape,
  Schema extends ZodObject<Shape>
>(
  form: UseFormReturn<Shape, Schema>,
  defaultValue?: Falsy<{ length: number }>
) => {
  const size = defaultValue ? defaultValue.length : 0;
  const [fields, setFields] = useState<ReadonlyArray<string>>(() =>
    rows(size)
  );

  const add = useCallback(() => {
    setFields((fields) => fields.concat(crypto.randomUUID()));
  }, []);

  const remove = useCallback((id: string) => {
    setFields((fields) => fields.filter((field) => field !== id));
  }, []);

  useEffect(() => {
    const element = form.ref.current;

    if (!element) {
      return;
    }

    const handleReset = () => {
      setFields(rows(size));
    };

    element.addEventListener("reset", handleReset);

    return () => {
      element.removeEventListener("reset", handleReset);
    };
  }, [form.ref, size]);

  return { fields, add, remove };
};
