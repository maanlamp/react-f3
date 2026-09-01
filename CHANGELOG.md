# Changelog

Only the breaking changes, and what to do about each one. Everything else is in the [commit history](https://github.com/maanlamp/react-f3/commits/main).

<br/>

## 4.0.0

`react-f3` no longer ships CSS. It used to inject a stylesheet setting `display: contents` on the `<form/>` and on the `<fieldset/>` that `<Form/>` renders, which meant the library decided how your elements laid out and overrode layouts you set yourself. Both elements now render unstyled, and `className` reaches the `<form/>` untouched.

To keep the old layout, take the wrapper out of the box tree yourself:

```css
form > fieldset {
  display: contents;
}
```

Without that rule the `<fieldset/>` is an ordinary box: it takes the browser's border, padding and margin, and it sits between the `<form/>` and the inputs, so a `grid` or `flex` layout on the `<form/>` no longer reaches them.

The `react-f3/main.css` export went with it. Delete any `import "react-f3/main.css"`, which will otherwise fail to resolve.

<br/>

## 3.0.0

A name carried by more than one input parses to an array. Only the last value used to survive, which left a checkbox group submitting a single checkbox. One input still yields one value, because nothing in `FormData` tells a group of one apart from a plain field; name the inputs `hobbies.0`, `hobbies.1` and so on where the schema wants an array either way.

`UsefieldParams` is now `UseFieldParams`. Only the casing changed.

`<Form/>` takes its props from `ComponentPropsWithoutRef<"form">` rather than `HTMLProps<HTMLFormElement>`. That is the type React actually accepts for the element, so props the old type let through are now rejected and a few it made optional are required. Nothing changed at runtime.

`DIGITS` is no longer exported. It was a detail of the parser.

<br/>

## 2.0.0

The form owns server-side issues, and `useForm`'s `defaultIssues` parameter is gone. Issues your schema can't produce now arrive two ways: `onSubmit` returns them to reject the submission it was handed, or you set them whenever you have them with `form.setIssues`, which is a plain state setter.

```tsx
const form = useForm({
  schema,
  onSubmit: async (data) => {
    const response = await save(data);

    if (!response.ok) {
      return response.issues;
    }
  },
});
```

Returning nothing still counts as a success. Because the form holds these issues, they behave like the schema's own: `form.validation` includes them, `form.isValid` is `false` while any are present, and the next submit, `reset()` and `resetValidation()` all clear them, so a stale rejection never outlives the data it was about.

Replace `defaultIssues: issues` with a `form.setIssues(issues)` wherever you computed them.
