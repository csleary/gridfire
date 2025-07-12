import { ChangeEvent, FormEvent, useState } from "react";

type FormatFunction = (value: string) => string;
type SubmitFunction = (values: object) => Promise<void>;
interface UseFormParams {
  defaultState: object;
  validate: ValidateFunction;
}

type ValidateFunction = (values: object) => object;

const useForm = ({ defaultState = {}, validate }: UseFormParams) => {
  const [errors, setErrors] = useState({});
  const [isPristine, setIsPristine] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [values, setValues] = useState(defaultState);
  const hasErrors = Object.values(errors).some(error => Boolean(error));

  const handleChange = (e: ChangeEvent<HTMLInputElement>, format: FormatFunction) => {
    const { name, value } = e.target;
    setIsPristine(false);
    setErrors(prev => ({ ...prev, [name]: "" }));
    const formattedValue = format ? format(value) : value;
    setValues(prev => ({ ...prev, [name]: formattedValue }));
  };

  const handleSubmit = (onSubmit: SubmitFunction) => async (e: FormEvent) => {
    try {
      e.preventDefault();
      const validationErrors = validate(values);
      if (Object.values(validationErrors).length) return setErrors(validationErrors);
      setIsSubmitting(true);
      await onSubmit(values);
      setIsPristine(true);
      setValues(defaultState);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    errors,
    handleChange,
    handleSubmit,
    hasErrors,
    isPristine,
    isSubmitting,
    values
  };
};

export { useForm };
