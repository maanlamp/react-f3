import { useCallback, useEffect, useState, type ReactNode } from "react";
import type { ZodObject, ZodRawShape } from "zod";
import type { UseFormReturn } from "./use-form";

export type FieldProps<
  Shape extends ZodRawShape,
  Schema extends ZodObject<Shape>
> = Readonly<{
  form: UseFormReturn<Shape, Schema>;
  name: string;
  children: (field: UseFieldReturn) => ReactNode;
}>;

/**
 * Render-prop form of {@link useField}, for reading one field's
 * value without splitting the surrounding component in two.
 *
 * @example
 * <Field form={form} name={form.fields.email()}>
 *   {(value) => <p>You typed {value}</p>}
 * </Field>
 */
export const Field = <
  Shape extends ZodRawShape,
  Schema extends ZodObject<Shape>
>({
  form,
  name,
  children,
}: FieldProps<Shape, Schema>) => children(useField({ form, name }));

export type UsefieldParams<
  Shape extends ZodRawShape,
  Schema extends ZodObject<Shape>
> = Readonly<{
  form: UseFormReturn<Shape, Schema>;
  name: string;
}>;

/**
 * The field's current value, or `undefined` while the form has not
 * mounted yet or no input carries that name.
 */
export type UseFieldReturn = string | undefined;

/**
 * Tracks one input's current value by listening for `input` and
 * `reset` on the form element.
 *
 * Re-renders the calling component on every keystroke in that field,
 * so reach for it where a field's value drives the UI, and leave the
 * rest of the form to the DOM.
 *
 * @example
 * const email = useField({ form, name: form.fields.email() });
 */
export const useField = <
  Shape extends ZodRawShape,
  Schema extends ZodObject<Shape>
>({
  form,
  name,
}: UsefieldParams<Shape, Schema>): UseFieldReturn => {
  const getInputValue = useCallback(
    () =>
      form.ref.current?.querySelector<HTMLInputElement>(`[name="${name}"]`)
        ?.value,
    [name, form.ref]
  );

  const [value, setValue] = useState<string>();

  useEffect(() => {
    setValue(getInputValue());
  }, []);

  useEffect(() => {
    if (!form.ref.current) {
      return;
    }

    const handle = (event: Event) => {
      const target = event.target as HTMLInputElement | null;
      if (target?.name !== name) {
        return;
      }
      setValue(target.value);
    };

    const handleReset = () => {
      setValue(getInputValue);
    };

    form.ref.current.addEventListener("input", handle);

    form.ref.current.addEventListener("reset", handleReset);

    return () => {
      form.ref.current?.removeEventListener("input", handle);
      form.ref.current?.removeEventListener("reset", handleReset);
    };
  }, []);

  return value;
};
