import {
  Alert,
  AlertDescription,
  AlertIcon,
  FormControl,
  FormLabel,
  FormHelperText,
  Input,
  Textarea
} from "@chakra-ui/react";
import { ChangeEvent, HTMLAttributes, KeyboardEvent, ReactNode } from "react";

interface Props {
  component?: string;
  error?: string;
  errors?: any;
  info?: ReactNode | string;
  inputMode?: HTMLAttributes<HTMLLIElement>["inputMode"];
  isDisabled?: boolean;
  isReadOnly?: boolean;
  isRequired?: boolean;
  label?: string;
  mb?: number;
  name: string;
  onBlur?: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onChange?: (e: ChangeEvent<HTMLInputElement & HTMLTextAreaElement>) => void;
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;
  size?: string;
  type?: string;
  value?: string;
  values?: any;
  variant?: string;
}

const Field = ({
  component = "",
  error = "",
  errors = {},
  info = "",
  inputMode,
  isDisabled,
  isReadOnly,
  isRequired,
  label = "",
  mb = 6,
  name,
  onBlur,
  onChange,
  onKeyDown,
  size,
  type = "text",
  value = "",
  values = {},
  variant,
  ...rest
}: Props) => {
  return (
    <FormControl as="fieldset" mb={mb}>
      <FormLabel htmlFor={name} color="gray.500" fontWeight={500} mb={1}>
        {label}
      </FormLabel>
      {component === "textarea" ? (
        <Textarea
          id={name}
          isDisabled={isDisabled}
          isReadOnly={isReadOnly}
          isRequired={isRequired}
          name={name}
          onBlur={onBlur}
          onChange={onChange}
          size={size}
          value={value || values[name] || ""}
          {...rest}
        />
      ) : (
        <Input
          id={name}
          inputMode={inputMode}
          isDisabled={isDisabled}
          isReadOnly={isReadOnly}
          isRequired={isRequired}
          name={name}
          onBlur={onBlur}
          onChange={onChange}
          onKeyDown={onKeyDown}
          size={size}
          type={type}
          value={value || values[name] || ""}
          variant={variant}
          {...rest}
        />
      )}
      {error || errors[name] ? (
        <Alert status="error">
          <AlertIcon />
          <AlertDescription>{error || errors[name]}</AlertDescription>
        </Alert>
      ) : typeof info !== "undefined" ? (
        <FormHelperText>{info}</FormHelperText>
      ) : null}
    </FormControl>
  );
};

export default Field;
