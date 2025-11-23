import { useCallback, useEffect, useState } from "react";
import type { ZodObject, ZodRawShape } from "zod";
import type { UseFormReturn } from "./use-form";

type Falsy<T> = T | false | 0 | "" | null | undefined | 0n;

export const useFieldset = <
  Shape extends ZodRawShape,
  Schema extends ZodObject<Shape>
>(
  form: UseFormReturn<Shape, Schema>,
  defaultValue?: Falsy<{ length: number }>
) => {
  const length = defaultValue || { length: 0 };
  const [fields, setFields] = useState<ReadonlyArray<string>>(
    Array.from(length, () => crypto.randomUUID())
  );

  const add = useCallback(() => {
    setFields((fields) => fields.concat(crypto.randomUUID()));
  }, []);

  const remove = useCallback((id: string) => {
    setFields((fields) => fields.filter((field) => field !== id));
  }, []);

  useEffect(() => {
    form.ref.current?.addEventListener("reset", () => {
      setFields(Array.from(length, () => crypto.randomUUID()));
    });
  });

  return { fields, add, remove };
};
