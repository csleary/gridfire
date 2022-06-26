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

const Field = ({ component, error, errors = {}, info, label, mb = 6, name, onChange, value, values = {}, ...rest }) => {
  return (
    <FormControl as="fieldset" mb={mb}>
      <FormLabel htmlFor={name} color="gray.500" fontWeight={500} mb={1}>
        {label}
      </FormLabel>
      {component === "textarea" ? (
        <Textarea id={name} name={name} onChange={onChange} value={value ?? values[name] ?? ""} />
      ) : (
        <Input id={name} name={name} onChange={onChange} value={value ?? values[name] ?? ""} {...rest} />
      )}
      {error || errors[name] ? (
        <Alert status="error">
          <AlertIcon />
          <AlertDescription>{error ?? errors[name]}</AlertDescription>
        </Alert>
      ) : typeof info !== "undefined" ? (
        <FormHelperText>{info}</FormHelperText>
      ) : null}
    </FormControl>
  );
};

export default Field;