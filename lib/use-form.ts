import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type FormEvent,
  type RefObject,
  type SetStateAction,
} from "react";
import { z, type ZodObject, type ZodRawShape } from "zod";
import { errorChain, type ErrorChainFromSchema } from "./error";
import { fieldChain, type FieldChainFromSchema } from "./field";
import { parseFormData } from "./parse";

/**
 * Zod issues, as produced by a schema or by your own code.
 */
export type Issues = ReadonlyArray<z.core.$ZodIssue>;

export type UseFormParams<
  Shape extends ZodRawShape,
  Schema extends ZodObject<Shape>
> = Readonly<{
  /**
   * Validates the submitted form data. Its output type is the type
   * of `onSubmit`'s argument, and its shape is the shape of the
   * `fields` and `errors` chains.
   */
  schema: Schema;

  /**
   * Called with the parsed data once the schema accepts a submission.
   *
   * Returning issues rejects the submission: they are added to the
   * form's validation as if the schema had produced them. Returning
   * nothing accepts it.
   */
  onSubmit: (
    data: z.core.output<Schema>
  ) => Promise<Issues | void> | Issues | void;
}>;

/**
 * The result of the last submit, including any issues added
 * afterwards. `undefined` until the first submit.
 */
export type Validation<
  Shape extends ZodRawShape,
  Schema extends ZodObject<Shape>
> = z.ZodSafeParseResult<z.core.output<Schema>>;

export type UseFormReturn<
  Shape extends ZodRawShape,
  Schema extends ZodObject<Shape>
> = Readonly<{
  /**
   * `true` from the moment a submission is handed to the schema
   * until `onSubmit` settles. `<Form/>` disables its fields while
   * this is `true`.
   */
  isSubmitting: boolean;

  /**
   * `false` while the form has any issue. `true` before the first
   * submit.
   */
  isValid: boolean;

  /**
   * The result of the last submit, including any issues added
   * afterwards. `undefined` until the first submit.
   */
  validation: Validation<Shape, Schema> | undefined;

  /**
   * Adds issues your schema can't produce, such as ones that arrive
   * from a server after the form was submitted. A regular state
   * setter, so it also takes an updater function.
   *
   * The next submit, `reset()` and `resetValidation()` all clear
   * them again.
   */
  setIssues: Dispatch<SetStateAction<Issues | undefined>>;

  /**
   * Drops every issue and returns the form to its pre-submit state,
   * leaving the inputs alone.
   */
  resetValidation: () => void;

  /**
   * Submit handler for the `<form/>` element. `<Form/>` attaches it
   * for you.
   */
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void;

  /**
   * Restores the inputs to their `defaultValue`s and drops every
   * issue.
   */
  reset: () => void;

  /**
   * Field names, shaped like the schema. Call a leaf to get its
   * `name` attribute: `fields.address.street()` yields
   * `"address.street"`.
   */
  fields: FieldChainFromSchema<Schema>;

  /**
   * Issues, shaped like the schema. Call a leaf to get the issue at
   * that path, or pass it a render function to render only when
   * there is one.
   */
  errors: ErrorChainFromSchema<Schema>;

  /**
   * Points at the `<form/>` element. Needed by `useField` and
   * `useFieldset`, and attached for you by `<Form/>`.
   */
  ref: RefObject<HTMLFormElement | null>;
}>;

/**
 * Validates a form with a Zod schema on submit, and hands you the
 * field names and issues to render.
 *
 * The form holds no field state of its own; values live in the DOM
 * until submitted, where `schema` parses them into `onSubmit`'s
 * argument.
 *
 * @example
 * const form = useForm({
 *   schema: z.object({ email: z.string() }),
 *   onSubmit: (data) => console.log(data.email),
 * });
 *
 * <Form form={form}>
 *   <input name={form.fields.email()} />
 *   {form.errors.email((issue) => <p>{issue.message}</p>)}
 *   <button type="submit">Submit</button>
 * </Form>
 */
export const useForm = <
  Shape extends ZodRawShape,
  Schema extends ZodObject<Shape>
>({
  schema,
  onSubmit,
}: UseFormParams<Shape, Schema>): UseFormReturn<Shape, Schema> => {
  const [parsed, setParsed] = useState<Validation<Shape, Schema>>();
  const [issues, setIssues] = useState<Issues>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const ref = useRef<HTMLFormElement>(null);

  const validation = useMemo(() => {
    const all = (parsed?.error?.issues ?? []).concat(issues ?? []);

    if (!all.length) {
      return parsed;
    }

    return {
      success: false,
      error: new z.ZodError(all),
    } as Validation<Shape, Schema>;
  }, [issues, parsed]);

  const isValid = validation?.success ?? true;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setIssues(undefined);
    try {
      const data = parseFormData(new FormData(e.currentTarget));
      const result = await schema.safeParseAsync(data);
      setParsed(result);
      if (result.success) {
        setIssues((await onSubmit(result.data)) || undefined);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const fields = useMemo(fieldChain<Schema>, []);

  const errors = useMemo(
    () => errorChain<Schema>(validation?.error?.issues),
    [validation]
  );

  const resetValidation = useCallback(() => {
    setParsed(undefined);
    setIssues(undefined);
  }, []);

  const reset = useCallback(() => {
    ref.current?.reset();
    resetValidation();
  }, [resetValidation]);

  return {
    isSubmitting,
    isValid,
    validation,
    setIssues,
    resetValidation,
    handleSubmit,
    reset,
    fields,
    errors,
    ref,
  };
};
