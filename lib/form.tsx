import classNames from "classnames";
import type { HTMLProps } from "react";
import type { ZodObject, ZodRawShape } from "zod";
import style from "./form.module.css";
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
 * other prop to the `<form/>`. Optional: attach those two yourself
 * and any `<form/>` will do.
 */
export const Form = <
  Shape extends ZodRawShape,
  Schema extends ZodObject<Shape>
>({
  children,
  className,
  form,
  ...rest
}: FormProps<Shape, Schema> &
  Omit<
    HTMLProps<HTMLFormElement>,
    keyof FormProps<Shape, Schema> | "onSubmit"
  >) => (
  <form
    className={classNames([style.form, className])}
    onSubmit={form.handleSubmit}
    ref={form.ref}
    {...rest}
  >
    <fieldset className={style.fieldset} disabled={form.isSubmitting}>
      {children}
    </fieldset>
  </form>
);
