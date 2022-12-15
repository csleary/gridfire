const Tooltip = {
  baseStyle: ({ colorMode }) => ({
    bgColor: colorMode === "dark" ? "gray.800" : "gray.200",
    color: colorMode === "dark" ? "gray.100" : "gray.800"
  }),
  defaultProps: {
    hasArrow: true,
    openDelay: 500
  }
};

export default Tooltip;
