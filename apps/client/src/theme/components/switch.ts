import { switchAnatomy } from "@chakra-ui/anatomy";
import { createMultiStyleConfigHelpers } from "@chakra-ui/react";

const { defineMultiStyleConfig, definePartsStyle } = createMultiStyleConfigHelpers(switchAnatomy.keys);

const baseStyle = definePartsStyle({
  track: {
    _checked: {
      _dark: {
        bg: "green.300"
      },
      bg: "green.400"
    }
  }
});

export const switchTheme = defineMultiStyleConfig({ baseStyle });
