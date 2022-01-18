import { Alert, AlertIcon, Box, Input, Text, Textarea } from "@chakra-ui/react";

const Field = ({ component, error, errors = {}, info, label, mb = 6, name, onChange, value, values = {}, ...rest }) => (
  <Box as="fieldset" mb={mb}>
    <Box as="label" htmlFor={name} color="gray.500" display="inline-block" fontWeight={500} mb={1}>
      {label}
    </Box>
    {component === "textarea" ? (
      <Textarea component="textarea" name={name} onChange={onChange} value={value ?? values[name] ?? ""} mb={2} />
    ) : (
      <Input name={name} onChange={onChange} value={value ?? values[name] ?? ""} {...rest} mb={2} />
    )}
    {error || errors[name] ? (
      <Alert status="error">
        <AlertIcon />
        {error ?? errors[name]}
      </Alert>
    ) : typeof info !== "undefined" ? (
      <Text color="gray.500" fontSize="sm">
        {info}
      </Text>
    ) : null}
  </Box>
);

export default Field;
