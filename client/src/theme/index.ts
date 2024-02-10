import Heading from "./components/heading";
import Input from "./components/input";
import Skeleton from "./components/skeleton";
import Textarea from "./components/textarea";
import Tooltip from "./components/tooltip";
import { switchTheme } from "./components/switch";
import { extendTheme } from "@chakra-ui/react";

const theme = {
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
