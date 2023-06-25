import { FormControl, FormHelperText, Textarea } from "@chakra-ui/react";
import { ChangeEventHandler } from "react";

interface Props {
  limit?: number;
  minHeight: number;
  onChange: ChangeEventHandler;
  size?: string;
  value: string;
}

const TextAreaWithCharLimit = ({ limit = 2000, onChange, size, value = "", ...rest }: Props) => {
  const charsRemaining = limit - value.length;

  return (
    <FormControl>
      <Textarea
        id="biography"
        name="biography"
        onChange={onChange}
        resize="vertical"
        size={size}
        value={value}
        {...rest}
      />
      <FormHelperText
        color={charsRemaining === 0 ? "red.500" : charsRemaining < 100 ? "orange.500" : undefined}
        fontWeight={charsRemaining === 0 ? 500 : undefined}
      >
        {`${charsRemaining} character${charsRemaining === 1 ? "" : "s"} remaining`}
      </FormHelperText>
    </FormControl>
  );
};

export default TextAreaWithCharLimit;
