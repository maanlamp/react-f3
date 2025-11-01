import type z from "zod";
import type { ZodObject } from "zod";

export type Primitive =
	| string
	| number
	| boolean
	| bigint
	| symbol
	| undefined
	| null;

export type DeepNonNullable<T> = T extends
	| Primitive
	| Date
	| File
	? NonNullable<T>
	: T extends {}
	? { [K in keyof T]-?: DeepNonNullable<T[K]> }
	: Required<T>;

export type FieldGetter = () => string;

export type FieldChain<T extends object> = {
	[P in keyof T]: T[P] extends Array<any>
		? (
				index: number
		  ) => FieldChain<T[P][0]> extends string
				? FieldGetter
				: FieldChain<T[P][0]>
		: T[P] extends Date
		? FieldGetter
		: T[P] extends File
		? FieldGetter
		: T[P] extends object
		? FieldChain<T[P]>
		: FieldGetter;
};

export type FieldChainFromSchema<T extends ZodObject> =
	FieldChain<DeepNonNullable<z.input<T>>>;

export const fieldChain = <
	Schema extends ZodObject
>(): FieldChainFromSchema<Schema> =>
	new Proxy(
		{},
		{ get: (_, k) => getFieldName([k]) }
	) as any;

const getFieldName = (
	path: ReadonlyArray<keyof any>
): any =>
	new Proxy(() => {}, {
		get: (_, k) => getFieldName([...path, k]),
		apply: (_, __, [arg]) => {
			if (typeof arg === "number") {
				return getFieldName([...path, arg]);
			}

			return path.join(".");
		}
	});
