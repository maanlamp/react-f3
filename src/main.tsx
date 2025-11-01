import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import z from "zod";
import { Form } from "../lib/form";
import { useField } from "../lib/use-field";
import useFieldset from "../lib/use-fieldset";
import { useForm } from "../lib/use-form";

const Schema = z.object({
	a: z.object({
		b: z.object({
			c: z.object({
				d: z.array(z.string().min(1).transform(Number))
			})
		})
	})
});

const customIssues: z.core.$ZodIssue[] = [
	{
		code: "custom",
		path: ["a.b.c.d.0"],
		message: "test 123"
	}
];

const App = () => {
	const defaultData = ["Franck", "Daniel", "Jimothy"];

	const form = useForm({
		schema: Schema,
		onSubmit: async data => {
			console.log(data);
			await new Promise(res => setTimeout(res, 1000));
		},
		defaultIssues: customIssues
	});

	const todos = useFieldset(form, defaultData);

	const firstField = useField({
		form,
		name: form.fields.a.b.c.d(0)()
	});

	return (
		<Form form={form}>
			{firstField}
			{todos.fields.map((id, i) => (
				<div
					key={id}
					style={{
						display: "flex",
						flexDirection: "row"
					}}>
					<div
						style={{
							display: "flex",
							flexDirection: "column"
						}}>
						<input
							name={form.fields.a.b.c.d(i)()}
							defaultValue={defaultData[i]}
						/>
						{form.errors.a.b.c.d(i)(err => (
							<p style={{ color: "red" }}>
								{err.message}
							</p>
						))}
					</div>
					{i >= defaultData.length && (
						<button
							type="button"
							onClick={() => todos.remove(id)}>
							-
						</button>
					)}
				</div>
			))}
			<button type="button" onClick={todos.add}>
				Add todo
			</button>
			<button type="button" onClick={form.reset}>
				Reset
			</button>
			<button type="submit">Submit</button>
		</Form>
	);
};

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<App />
	</StrictMode>
);
