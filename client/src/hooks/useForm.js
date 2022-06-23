import { useState } from "react";

const useForm = ({ defaultState = {}, validate }) => {
  const [errors, setErrors] = useState({});
  const [isPristine, setIsPristine] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [values, setValues] = useState(defaultState);
  const hasErrors = Object.values(errors).some(error => Boolean(error));

  const handleChange = (e, format) => {
    const { name, value } = e.target;
    setIsPristine(false);
    setErrors(({ [name]: field, ...rest }) => rest);
    const formattedValue = format ? format(value) : value;
    setValues(prev => ({ ...prev, [name]: formattedValue }));
  };

  const handleSubmit = onSubmit => async e => {
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
    hasErrors,
    handleChange,
    handleSubmit,
    isPristine,
    isSubmitting,
    values
  };
};

export { useForm, useForm as default };
