import { useCallback, useEffect, useState, type ReactNode } from "react";
import type { ZodObject, ZodRawShape } from "zod";
import type { UseFormReturn } from "./use-form";

/**
 * Escapes a field name for use inside a double-quoted attribute
 * selector, where only the quote and the escape character itself
 * need it.
 */
const escape = (name: string) => name.replace(/["\\]/g, "\\$&");

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

export type UseFieldParams<
  Shape extends ZodRawShape,
  Schema extends ZodObject<Shape>
> = Readonly<{
  form: UseFormReturn<Shape, Schema>;
  name: string;
}>;

/**
 * The value the field would submit, or `undefined` while the form
 * has not mounted yet, when no input carries that name, or when
 * nothing in a checkbox or radio group is checked.
 */
export type UseFieldReturn = string | undefined;

/**
 * Tracks one input's current value by listening for `input` and
 * `reset` on the form element.
 *
 * Reports what the field would submit rather than what the element
 * holds, so an unchecked checkbox reads as `undefined` and a radio
 * group reads as the value of whichever option is checked.
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
}: UseFieldParams<Shape, Schema>): UseFieldReturn => {
  const getInputValue = useCallback((): UseFieldReturn => {
    const elements = form.ref.current?.querySelectorAll<HTMLInputElement>(
      `[name="${escape(name)}"]`
    );

    if (!elements?.length) {
      return;
    }

    const [first] = elements;

    // A checkbox or radio submits its value only while checked, and
    // a radio group shares one name across every option.
    if (first.type === "checkbox" || first.type === "radio") {
      return Array.from(elements).find((element) => element.checked)?.value;
    }

    return first.value;
  }, [form.ref, name]);

  const [value, setValue] = useState<UseFieldReturn>();

  useEffect(() => {
    setValue(getInputValue());
  }, [getInputValue]);

  useEffect(() => {
    const element = form.ref.current;

    if (!element) {
      return;
    }

    let restore: ReturnType<typeof setTimeout>;

    const handle = (event: Event) => {
      if ((event.target as HTMLInputElement | null)?.name !== name) {
        return;
      }

      setValue(getInputValue());
    };

    // The form is only reset once this event has been dispatched, so
    // the inputs still hold their old values while it runs.
    const handleReset = () => {
      restore = setTimeout(() => setValue(getInputValue()));
    };

    element.addEventListener("input", handle);
    element.addEventListener("reset", handleReset);

    return () => {
      clearTimeout(restore);
      element.removeEventListener("input", handle);
      element.removeEventListener("reset", handleReset);
    };
  }, [form.ref, getInputValue, name]);

  return value;
};
