const Input = {
  parts: ["field", "addon"],
  variants: {
    outline: ({ colorMode }) => ({
      field: {
        backgroundColor: colorMode === "dark" ? "gray.700" : "white",
        borderColor: colorMode === "dark" ? "gray.600" : "gray.200",
        color: colorMode === "dark" ? "gray.200" : "black"
      }
    })
  },
  defaultProps: {
    size: "md"
  }
};

export default Input;
