import {
  ChakraProps,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Input,
  Textarea,
  useColorModeValue
} from "@chakra-ui/react";
import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import { ChangeEvent, HTMLAttributes, KeyboardEvent, ReactNode } from "react";

import Icon from "@/components/icon";

interface Props extends ChakraProps {
  component?: string;
  error?: string;
  errors?: any;
  info?: ReactNode | string;
  inputMode?: HTMLAttributes<HTMLLIElement>["inputMode"];
  isDisabled?: boolean;
  isInvalid?: boolean;
  isReadOnly?: boolean;
  isRequired?: boolean;
  label?: string;
  mb?: number;
  min?: number;
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
  isInvalid,
  isReadOnly,
  isRequired,
  label = "",
  mb = 6,
  min,
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
    <FormControl isInvalid={Boolean(isInvalid || error || errors[name])} mb={mb}>
      <FormLabel color="gray.500" fontWeight={500} htmlFor={name} mb={1}>
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
          min={min}
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
      {!isInvalid && !error && !errors[name] ? (
        <FormHelperText>{info}</FormHelperText>
      ) : (
        <FormErrorMessage>
          <Icon color={errorAlertColor} fixedWidth icon={faTriangleExclamation} mr={2} />
          {error || errors[name]}
        </FormErrorMessage>
      )}
    </FormControl>
  );
};

export default Field;
