const Textarea = {
  parts: ["field", "addon"],
  variants: {
    outline: ({ colorMode }) => ({
      backgroundColor: colorMode === "dark" ? "gray.700" : "white"
    })
  }
};

export default Textarea;
