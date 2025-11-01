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
		{...rest}>
		<fieldset
			className={style.fieldset}
			disabled={form.isSubmitting}>
			{children}
		</fieldset>
	</form>
);
