import { useState } from 'react';
export { default as Input } from 'components/input';

const useForm = ({ defaultState = {}, validate }) => {
  const [errors, setErrors] = useState({});
  const [isPristine, setIsPristine] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [values, setValues] = useState(defaultState);
  const hasErrors = Object.values(errors).some(error => Boolean(error));

  const handleChange = (e, format) => {
    const { name, value } = e.target;
    setIsPristine(false);

    setErrors(prev => {
      if (prev[name]) {
        const next = { ...prev };
        delete next[name];
        return next;
      }

      return prev;
    });

    let formattedValue = value;
    if (format) formattedValue = format(value);
    setValues(prev => ({ ...prev, [name]: formattedValue }));
  };

  const handleSubmit = onSubmit => async e => {
    try {
      e.preventDefault();
      const errors = validate(values);
      if (Object.values(errors).length) return setErrors(errors);
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
