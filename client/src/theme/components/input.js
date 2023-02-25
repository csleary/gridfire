const Input = {
  parts: ["field", "addon"],
  variants: {
    outline: {
      field: {
        backgroundColor: "white",
        borderColor: "gray.200",
        color: "black",
        _dark: {
          backgroundColor: "gray.700",
          borderColor: "gray.600",
          color: "gray.200"
        }
      }
    },
    modal: {
      field: {
        backgroundColor: "gray.100",
        borderColor: "gray.300",
        borderWidth: "1px",
        _dark: {
          backgroundColor: "gray.800",
          borderColor: "gray.600"
        }
      }
    }
  },
  defaultProps: {
    size: "md"
  }
};

export default Input;
