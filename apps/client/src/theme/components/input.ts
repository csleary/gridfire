import { createMultiStyleConfigHelpers } from "@chakra-ui/react";

const { defineMultiStyleConfig } = createMultiStyleConfigHelpers(["field", "addon"]);

const Input = defineMultiStyleConfig({
  defaultProps: {
    size: "md"
  },
  variants: {
    modal: {
      field: {
        _dark: {
          _invalid: {
            borderColor: "red.300",
            boxShadow: `0 0 0 1px red.300`
          },
          backgroundColor: "gray.800",
          borderColor: "gray.600"
        },
        backgroundColor: "gray.100",
        borderColor: "gray.300",
        borderWidth: "1px"
      }
    },
    outline: {
      field: {
        _dark: {
          backgroundColor: "gray.700",
          borderColor: "gray.600",
          color: "gray.200"
        },
        backgroundColor: "white",
        borderColor: "gray.200",
        color: "black"
      }
    }
  }
});

export default Input;
