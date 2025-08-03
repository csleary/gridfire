import { theme as baseTheme, extendTheme } from "@chakra-ui/react";

import Heading from "./components/heading";
import Input from "./components/input";
import Skeleton from "./components/skeleton";
import { switchTheme } from "./components/switch";
import Textarea from "./components/textarea";
import Tooltip from "./components/tooltip";

const theme = {
  breakpoints: { ...baseTheme.breakpoints, "3xl": "120rem" },
  components: {
    Heading,
    Input,
    Skeleton,
    Switch: switchTheme,
    Textarea,
    Tooltip
  },
  config: {
    initialColorMode: "dark",
    useSystemColorMode: false
  }
};

export default extendTheme(theme);
