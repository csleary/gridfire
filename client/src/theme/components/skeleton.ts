import { defineStyleConfig, keyframes } from "@chakra-ui/react";

const animation = keyframes`
  to { background-position:left; }
`;

const Skeleton = defineStyleConfig({
  baseStyle: {
    _dark: {
      background:
        "linear-gradient(-45deg, var(--skeleton-start-color) 40%, var(--chakra-colors-gray-700), var(--skeleton-start-color) 60%) right/450% 100%",
      animation: `${animation} 2s cubic-bezier(.1, .8, .1, 1) 0.5s infinite`
    }
  }
});

export default Skeleton;
