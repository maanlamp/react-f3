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

`React-f3` promises to take a step back, rethink what a form actually is (and importantly, what it **_is not_**), and makes developing these forms a delightful yet robust experience.

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
<summary>Click here to open a simple example for a login form using email and password</summary>

```tsx
import { Form, useForm } from "react-f3";
import z from "zod";

const FormSchema = z.object({
  email: z.string().refine((x) => x.includes("@")),
  password: z.string().min(8),
});

const Issue = ({ issue }: { issue: z.core.$ZodIssue }) => (
  <p style={{ color: "red" }}>{issue.message}</p>
);

const UserForm = () => {
  const form = useForm({
    schema: FormSchema,
    onSubmit: async (data) => {
      // Simulate network, wait a second
      await new Promise((res) => setTimeout(res, 1000));
      // Validated and transformed data!
      console.log(data);
    },
  });

  return (
    <Form form={form}>
      <label>
        <span>Email</span>
        <input name={form.fields.email()} />
        {form.errors.email((issue) => (
          <Issue issue={issue} />
        ))}
      </label>
      <label>
        <span>Password</span>
        <input name={form.fields.password()} type="password" />
        {form.errors.password((issue) => (
          <Issue issue={issue} />
        ))}
      </label>
      <button type="submit">Submit</button>
    </Form>
  );
};
```

That's it. No default state in the form, as that's not the place where your defaults should be stored. Notice how you can use an error chain with a render function to conditionally render when there is an issue matching the issue chain.

</details>

### `useFieldSet` (To-do list with default state)

<details>
<summary>Click here for an example of a set of fields that you can add to, edit & remove from.</summary>

```tsx
// Normally, these would come from some backend query.
// Consider using something like react-query for this!
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
    // when submitting.
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
  );
};
```

</details>

### Integration with `react-select`

<details>
<summary>Click here to open the example using react-select</summary>

Because we can't rely on the FormData API to distinguish between single and multi entry fields, we have to do some mapping of values to allow react-f3 to pick up the inputs in the form data.

```tsx
import { useMemo, useState, type ReactNode } from "react";
import { Form, useForm, type FieldGetter } from "react-f3";
import ReactSelect, { type GroupBase, type Props } from "react-select";
import z from "zod";

const hobbies = [
  "Programming",
  "Thinking about programming",
  "Making music",
  "Sleeping",
];

const FormSchema = z.object({
  hobbies: z.array(z.enum(hobbies)).min(2),
});

const Issue = ({ issue }: { issue: z.core.$ZodIssue }) => (
  <p style={{ color: "red" }}>{issue.message}</p>
);

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
}: Omit<Props<Option<T>, IsMulti, Group>, keyof SelectProps> & SelectProps) => {
  const [values, setValues] = useState<ReadonlyArray<Option<T>>>([]);

  return (
    <>
      <ReactSelect
        onChange={(options, meta) => {
          onChange?.(options, meta);
          setValues([options].flat().filter((x) => !!x));
        }}
        {...props}
      />
      {values.map(({ value }, i) => {
        const str = String(value);
        return <input key={str} type="hidden" name={name(i)()} value={str} />;
      })}
    </>
  );
};

const Hobbiesform = () => {
  const form = useForm({
    schema: FormSchema,
    onSubmit: async (data) => {
      // Simulate network, wait a second
      await new Promise((res) => setTimeout(res, 1000));
      // Validated and transformed data!
      console.log(data);
    },
  });

  const options = useMemo(
    () =>
      hobbies.map((hobby) => ({
        label: hobby,
        value: hobby,
      })),
    [hobbies]
  );

  return (
    <Form form={form}>
      <label>
        <span>Hobbies</span>
        <Select name={form.fields.hobbies} isMulti options={options} />
        {form.errors.hobbies((issue) => (
          <Issue issue={issue} />
        ))}
      </label>
      <button type="submit">Submit</button>
    </Form>
  );
};
```

As you can see, you can pass the `FieldGetter` directly to a Select component, which in turn can render hidden inputs per value using the getter with an index.

The type juggling around the Select component is just to treat single and multi inputs the same. Single input selects will work without issue, as they don't yield array values.

</details>

<br/>
<br/>

## Thanks

Shout out to @esamattis' [`react-zorm`](https://github.com/esamattis/react-zorm) for being a big inspiration, but it's sadly no longer maintained.
