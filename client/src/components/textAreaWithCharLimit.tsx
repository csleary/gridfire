import { FormControl, FormHelperText, Textarea } from "@chakra-ui/react";
import { ChangeEventHandler } from "react";

interface Props {
  limit?: number;
  onChange: ChangeEventHandler;
  value: string;
}

const TextAreaWithCharLimit = ({ limit = 2000, onChange, value = "" }: Props) => {
  const charsRemaining = limit - value.length;

  return (
    <FormControl>
      <Textarea id="biography" name="biography" onChange={onChange} value={value} />
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
