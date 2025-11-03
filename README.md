# React F3

<br/>
<br/>
<br/>

<div align="center">

**_F3: Form, form, form!_**

Components, hooks & utilities for creating and managing delightfully simple form experiences in React.

</div>

<br/>
<br/>

## Why?

Creating forms should be simple. React code should be idiomatic. Code should be type-safe.

Somehow, all the biggest form libraries for React do not tick all these boxes. They either:

- Jump through crazy hoops to prevent React form doing state management, which it's made for.
- Sacrifice usability for type-safety.
- Aren't type-safe at all.

React-f3 promises to take a step back, rethink what a form actually is (and importantly, what it **_is not_**), and makes developing these forms a delightful yet robust experience.

<br/>
<br/>

## What does F3 stand for?

It stands for `form, form, form`, of course! This is because, when using this package, your forms will often start with the following:

```tsx
<Form form={form}>
```

<br/>
<br/>

## Examples

### Email & password

<details>
<summary>Click here to open the example using react-select</summary>

```tsx
import { Form, useForm } from "react-f3";
import z from "zod";

const FormSchema = z.object({
	email: z.string().refine(x => x.includes("@")),
	password: z.string().min(8)
});

const Issue = ({
	issue
}: {
	issue: z.core.$ZodIssue;
}) => <p style={{ color: "red" }}>{issue.message}</p>;

const UserForm = () => {
	const form = useForm({
		schema: FormSchema,
		onSubmit: async data => {
			// Simulate network, wait a second
			await new Promise(res => setTimeout(res, 1000));
			// Validated and transformed data!
			console.log(data);
		}
	});

	return (
		<Form form={form}>
			<label>
				<span>Email</span>
				<input name={form.fields.email()} />
				{form.errors.email(issue => (
					<Issue issue={issue} />
				))}
			</label>
			<label>
				<span>Password</span>
				<input
					name={form.fields.password()}
					type="password"
				/>
				{form.errors.password(issue => (
					<Issue issue={issue} />
				))}
			</label>
			<button type="submit">Submit</button>
		</Form>
	);
};
```

</details>

That's it. No default state in the form, as that's not the place where your defaults should be stored. Notice how you can use an error chain with a render function to conditionally render when there is an issue matching the issue chain.

<br/>

### Integration with `react-select`

Because we can't rely on the FormData API to distinguish between single and multi entry fields, we have to do some mapping of values to allow react-f3 to pick up the inputs in the form data.

<details>
<summary>Click here to open the example using react-select</summary>

```tsx
import {
	useMemo,
	useState,
	type ReactNode
} from "react";
import {
	Form,
	useForm,
	type FieldGetter
} from "react-f3";
import ReactSelect, {
	type GroupBase,
	type Props
} from "react-select";
import z from "zod";

const hobbies = [
	"Programming",
	"Thinking about programming",
	"Making music",
	"Sleeping"
];

const FormSchema = z.object({
	hobbies: z.array(z.enum(hobbies)).min(2)
});

const Issue = ({
	issue
}: {
	issue: z.core.$ZodIssue;
}) => <p style={{ color: "red" }}>{issue.message}</p>;

type SelectProps = Readonly<{
	name: (n: number) => FieldGetter;
}>;

type Option<T> = Readonly<{
	label: ReactNode;
	value: T;
}>;

const Select = <
	T,
	IsMulti extends boolean,
	Group extends GroupBase<Option<T>>
>({
	name,
	onChange,
	...props
}: Omit<
	Props<Option<T>, IsMulti, Group>,
	keyof SelectProps
> &
	SelectProps) => {
	const [values, setValues] = useState<
		ReadonlyArray<Option<T>>
	>([]);

	return (
		<>
			<ReactSelect
				onChange={(options, meta) => {
					onChange?.(options, meta);
					setValues([options].flat().filter(x => !!x));
				}}
				{...props}
			/>
			{values.map(({ value }, i) => {
				const str = String(value);
				return (
					<input
						key={str}
						type="hidden"
						name={name(i)()}
						value={str}
					/>
				);
			})}
		</>
	);
};

const Hobbiesform = () => {
	const form = useForm({
		schema: FormSchema,
		onSubmit: async data => {
			// Simulate network, wait a second
			await new Promise(res => setTimeout(res, 1000));
			// Validated and transformed data!
			console.log(data);
		}
	});

	const options = useMemo(
		() =>
			hobbies.map(hobby => ({
				label: hobby,
				value: hobby
			})),
		[hobbies]
	);

	return (
		<Form form={form}>
			<label>
				<span>Hobbies</span>
				<Select
					name={form.fields.hobbies}
					isMulti
					options={options}
				/>
				{form.errors.hobbies(issue => (
					<Issue issue={issue} />
				))}
			</label>
			<button type="submit">Submit</button>
		</Form>
	);
};
```

</details>

As you can see, you can pass the `FieldGetter` directly to a Select component, which in turn can render hidden inputs per value using the getter with an index.

The type juggling around the Select component is just to treat single and multi inputs the same. Single input selects will work without issue, as they don't yield array values.

<br/>
<br/>

## Thanks

Shout out to @esamattis' [`react-zorm`](https://github.com/esamattis/react-zorm) for being a big inspiration, but it's sadly no longer maintained.
