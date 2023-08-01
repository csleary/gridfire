import {
  Alert,
  AlertDescription,
  FormControl,
  FormLabel,
  FormHelperText,
  Input,
  Textarea,
  useColorModeValue
} from "@chakra-ui/react";
import { ChangeEvent, HTMLAttributes, KeyboardEvent, ReactNode } from "react";
import Icon from "components/icon";
import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";

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
  const errorAlertColor = useColorModeValue("red.800", "red.200");

  return (
    <FormControl as="fieldset" isInvalid={error || errors[name]} mb={mb}>
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
        <Alert status="error" mt={2}>
          <Icon color={errorAlertColor} fixedWidth icon={faTriangleExclamation} mr={3} />
          <AlertDescription>{error || errors[name]}</AlertDescription>
        </Alert>
      ) : info ? (
        <FormHelperText>{info}</FormHelperText>
      ) : null}
    </FormControl>
  );
};

export default Field;
