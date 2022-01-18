const Progress = {
  parts: ["filledTrack", "track"],
  baseStyle: ({ isIndeterminate }) => ({
    filledTrack: {
      bgImage: isIndeterminate
        ? `linear-gradient(to right,
            transparent 0%,
            var(--chakra-colors-blue-200) 33%,
            var(--chakra-colors-green-200) 66%,
            transparent 100%)`
        : "blue.300"
    },
    track: {
      backgroundColor: isIndeterminate && "blue.100"
    }
  }),
  variants: {
    dragAccept: {
      track: {
        backgroundColor: "green.100"
      }
    },
    dragReject: {
      track: {
        backgroundColor: "red.100"
      }
    },
    uploading: {
      track: {
        backgroundColor: "blue.100"
      }
    }
  },
  defaultProps: { hasStripe: true, size: "sm" }
};

export default Progress;
