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

## What is React-F3?

Some light-weight helper functions, components and hooks for creating forms in React, leveraging as much of HTML's native form & input API's as possible. Using Zod for validating the submitted data and some freshly squeezed TypeScript-juice, that's all you need for any form in React; be they for your personal projects, or ginormous multi-step enterprise payment forms that vacuum the office at the same time 😎.

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

<br/>
<br/>

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

<br/>
<br/>

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

<br/>
<br/>

</details>

<br/>
<br/>

## FAQ

<details>
<summary>How do you store default state?</summary>

<br/>

That's the neat part: you don't! React is specifically made to track your application state and render the UI accordingly, no need to do this in the form as well.

_But then what would we recommend instead?_

Often times, your default state lives on the server, so it would only be logical to simply keep it there. Consider using a library like [`react-query`](https://tanstack.com/query/latest/docs/framework/react/overview) for fetching your defaults, and leverage React's components to just pass that data through. Rendering defaults is as simple as providing the `defaultValue` prop to an `<input/>`!

```tsx
const Example = () => {
  const url = "https://example.com/api/v1/things?pagesize=10&page=3";
  const query = useQuery({
    queryKey: [url],
    queryFn: () => fetch(url)
  });

  const form = useForm({
    schema: /*...*/,
    onSubmit: /*...*/,
  });

  if (query.isLoading) {
    // Please use a better loading state than this 😉
    return "Loading...";
  }

  <Form form={form}>
    <input
      name={form.fields.fieldName}
      defaultValue={query.data.fieldName ?? ""}
    />
  </Form>
}
```

If your state is fully local, then it's even easier: render an input with a `defaultValue` pointing to that state.

<br/>

</details>

<details>
<summary>How do you render dependent fields? (aka how to read the form's current state)</summary>

<br/>

React-F3 does not store any form state, and that's by design. While it could be a nice quality-of-life feature, it's also the main reason other form libraries are either really slow, or why they are designed to circumvent React through subscriptions and/or black magic and Proxy objects. If you want to track state for any specific fields, just do that; add a `useState` hook and update it `onChange`, simple as that!

```tsx
const Example = () => {
  const form = useForm({
    schema: /*...*/,
    onSubmit: /*...*/,
  });

  const [fieldValue, setFieldValue] = useState("");

  <Form form={form}>
    <input
    name={form.fields.fieldName}
    value={fieldValue}
    onChange={({currentTarget: { value } }) => setFieldValue(value)}
  />
    The current field value is "{fieldValue}"
  </Form>
}
```

HTML's native form api provides several ways of reading any input's current value, and `react-f3` exports some utilities for easily integrating those with React. If you just want the current value of a field in your form, you can use the `useField()` hook.

```tsx
const Example = () => {
  const form = useForm({
    schema: /*...*/,
    onSubmit: /*...*/,
  });

  const fieldValue = useField({
    form,
    name: form.fields.fieldName()
  });

  <Form form={form}>
    <input name={form.fields.fieldName} />
    The current field value is "{fieldValue}"
  </Form>
}
```

<br/>

</details>

<details>
<summary>Why is there a <code>&lt;Form/&gt;</code> component?</summary>

<br/>

It's a small helper component that wraps your forms in a `<fieldset/>` which gets disabled while your form is submitting. A neat feature of HTML's native form api is that any input that is a child of a disabled fieldset will also get disabled! There is absolutely no need to use the `<Form/>` component, but it is a good basic user experience.

<br/>

</details>

<br/>

Do you have any unanswered questions? Create an issue! If it gets enough 👍s it will get added here.

<br/>
<br/>

## What does F3 stand for?

It stands for `form, form, form`, of course! This is because, when using this package, your forms will often start with the following:

```tsx
<Form form={form}>
```

<br/>
<br/>

## Featured

I'd love to hear about all of your creative forms using this library. If you want to share, get in touch and your creations could be featured here!

<br/>
<br/>

## Contributing

Don't hesitate to create an issue if you run into any problems using `react-f3`. Pull requests are also very welcome!

<br/>
<br/>

## Thanks

Shout out to @esamattis' [`react-zorm`](https://github.com/esamattis/react-zorm) for being a big inspiration, but it's sadly no longer maintained.

Big thanks to @colinhacks for creating [`zod`](https://github.com/colinhacks/zod), and featuring `react-f3` in the zod ecosystem!
