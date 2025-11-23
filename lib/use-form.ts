import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type RefObject,
} from "react";
import { z, type ZodObject, type ZodRawShape } from "zod";
import { errorChain, type ErrorChainFromSchema } from "./error";
import { fieldChain, type FieldChainFromSchema } from "./field";
import { parseFormData } from "./parse";

export type UseFormParams<
  Shape extends ZodRawShape,
  Schema extends ZodObject<Shape>
> = Readonly<{
  schema: Schema;
  onSubmit: (data: z.core.output<Schema>) => Promise<void> | void;
  defaultIssues?: ReadonlyArray<z.core.$ZodIssue>;
}>;

export type Validation<
  Shape extends ZodRawShape,
  Schema extends ZodObject<Shape>
> = z.ZodSafeParseResult<z.core.output<Schema>>;

export type UseFormReturn<
  Shape extends ZodRawShape,
  Schema extends ZodObject<Shape>
> = Readonly<{
  isSubmitting: boolean;
  isValid: boolean;
  validation: Validation<Shape, Schema> | undefined;
  resetValidation: () => void;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
  reset: () => void;
  fields: FieldChainFromSchema<Schema>;
  errors: ErrorChainFromSchema<Schema>;
  ref: RefObject<HTMLFormElement | null>;
}>;

export const useForm = <
  Shape extends ZodRawShape,
  Schema extends ZodObject<Shape>
>({
  schema,
  onSubmit,
  defaultIssues,
}: UseFormParams<Shape, Schema>): UseFormReturn<Shape, Schema> => {
  const [validation, setValidation] = useState<
    Validation<Shape, Schema> | undefined
  >(
    defaultIssues?.length
      ? ({
          success: false,
          error: new z.ZodError(defaultIssues as any),
        } as Validation<Shape, Schema>)
      : undefined
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isValid = validation?.success ?? true;
  const ref = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const data = parseFormData(new FormData(e.currentTarget));
      const result = await schema.safeParseAsync(data);
      setValidation(result);
      if (result.success) {
        return await onSubmit(result.data);
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
    setValidation(undefined);
  }, []);

  const reset = useCallback(() => {
    ref.current?.reset();
    resetValidation();
  }, []);

  return {
    isSubmitting,
    isValid,
    validation,
    resetValidation,
    handleSubmit,
    reset,
    fields,
    errors,
    ref,
  };
};
