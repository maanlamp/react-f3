import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import z from "zod";
import { Form } from "../lib/form";
import { useFieldset } from "../lib/use-fieldset";
import { useForm } from "../lib/use-form";

// Normally, these would come from some backend query
const defaults = [
  "Wake up",
  "Drink coffee",
  "Do some programming",
  "Go to bed",
] as const;

// HTML5 checkboxes can have custom values, but yield
// "on" by default.
const createCheckboxSchema = (values: string | string[] = "on") =>
  z.enum([values].flat());

const Schema = z.object({
  todos: z
    .record(
      z.string(),
      z.object({
        todo: z.string().trim().nonempty(),
        done: createCheckboxSchema(),
      })
    )
    // Note the transform here, we just want an array
    .transform(Object.values),
});

const App = () => {
  const [isEditMode, setIsEditMode] = useState(false);

  const form = useForm({
    schema: Schema,
    onSubmit: async (data) => {
      // Wait a second, simulate network
      await new Promise((res) => setTimeout(res, 1000));
      console.log(data);
    },
  });

  const todos = useFieldset(
    form,
    // Try removing the `isEditMode` check and see what happens!
    isEditMode && defaults
  );

  const [done, setDone] = useState<typeof todos.fields>([]);

  return (
    <StrictMode>
      <Form form={form}>
        <fieldset>
          <legend>List (todos) add/remove/edit</legend>
          <button type="button" onClick={() => setIsEditMode(!isEditMode)}>
            {isEditMode ? "Disable" : "Enable"} edit mode
          </button>
          {todos.fields.map((id, i) => (
            <div
              key={id}
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: ".5rem",
              }}
            >
              <input
                type="checkbox"
                name={form.fields.todos[id].done()}
                onChange={({ currentTarget: { checked } }) => {
                  if (checked) {
                    setDone(done.concat(id));
                  } else {
                    const index = done.indexOf(id);
                    setDone(done.toSpliced(index, 1));
                  }
                }}
              />
              <input
                name={form.fields.todos[id].todo()}
                disabled={done.includes(id)}
                defaultValue={isEditMode ? defaults?.[i] : ""}
              />
              <button type="button" onClick={() => todos.remove(id)}>
                -
              </button>
            </div>
          ))}
          <button type="button" onClick={todos.add}>
            Add todo
          </button>
          <button type="submit">submit</button>
          <pre style={{ color: "red" }}>
            {JSON.stringify(form.validation?.error)}
          </pre>
        </fieldset>
      </Form>
    </StrictMode>
  );
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
