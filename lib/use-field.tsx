import {
	useCallback,
	useEffect,
	useState,
	type ReactNode
} from "react";
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

export const Field = <
	Shape extends ZodRawShape,
	Schema extends ZodObject<Shape>
>({
	form,
	name,
	children
}: FieldProps<Shape, Schema>) =>
	children(useField({ form, name }));

export type UsefieldParams<
	Shape extends ZodRawShape,
	Schema extends ZodObject<Shape>
> = Readonly<{
	form: UseFormReturn<Shape, Schema>;
	name: string;
}>;

export type UseFieldReturn = string | undefined;

export const useField = <
	Shape extends ZodRawShape,
	Schema extends ZodObject<Shape>
>({
	form,
	name
}: UsefieldParams<Shape, Schema>): UseFieldReturn => {
	const getInputValue = useCallback(
		() =>
			form.ref.current?.querySelector<HTMLInputElement>(
				`[name="${name}"]`
			)?.value,
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
			const target =
				event.target as HTMLInputElement | null;
			if (target?.name !== name) {
				return;
			}
			setValue(target.value);
		};

		const handleReset = () => {
			setValue(getInputValue);
		};

		form.ref.current.addEventListener("input", handle);

		form.ref.current.addEventListener(
			"reset",
			handleReset
		);

		return () => {
			form.ref.current?.removeEventListener(
				"input",
				handle
			);
			form.ref.current?.removeEventListener(
				"reset",
				handleReset
			);
		};
	}, []);

	return value;
};
