import type { ComponentPropsWithoutRef } from "react";
import type { ZodObject, ZodRawShape } from "zod";
import type { UseFormReturn } from "./use-form";

export type FormProps<
  Shape extends ZodRawShape,
  Schema extends ZodObject<Shape>
> = Readonly<{
  form: UseFormReturn<Shape, Schema>;
}>;

/**
 * A `<form/>` whose children sit in a `<fieldset/>` that is disabled
 * while the form is submitting, which disables every input inside
 * it.
 *
 * Attaches `form.handleSubmit` and `form.ref`, and forwards every
 * other prop to the `<form/>`. Those two win over anything spread
 * in, since replacing the ref would cut `useField`, `useFieldset`
 * and `reset()` off from the element they read.
 *
 * Optional: attach both yourself and any `<form/>` will do.
 */
export const Form = <
  Shape extends ZodRawShape,
  Schema extends ZodObject<Shape>
>({
  children,
  form,
  ...rest
}: FormProps<Shape, Schema> &
  Omit<
    ComponentPropsWithoutRef<"form">,
    keyof FormProps<Shape, Schema> | "onSubmit"
  >) => (
  <form {...rest} onSubmit={form.handleSubmit} ref={form.ref}>
    <fieldset disabled={form.isSubmitting}>{children}</fieldset>
  </form>
);
