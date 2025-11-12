import {
	useCallback,
	useEffect,
	useState
} from "react";
import type { ZodObject, ZodRawShape } from "zod";
import type { UseFormReturn } from "./use-form";

export const useFieldset = <
	Shape extends ZodRawShape,
	Schema extends ZodObject<Shape>
>(
	form: UseFormReturn<Shape, Schema>,
	defaultValue: { length: number } = { length: 0 }
) => {
	const [fields, setFields] = useState<
		ReadonlyArray<string>
	>(
		Array.from(defaultValue, () => crypto.randomUUID())
	);

	const add = useCallback(() => {
		setFields(fields =>
			fields.concat(crypto.randomUUID())
		);
	}, []);

	const remove = useCallback((id: string) => {
		setFields(fields =>
			fields.filter(field => field !== id)
		);
	}, []);

	useEffect(() => {
		form.ref.current?.addEventListener("reset", () => {
			setFields(
				Array.from(defaultValue, () =>
					crypto.randomUUID()
				)
			);
		});
	});

	return { fields, add, remove };
};
