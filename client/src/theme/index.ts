import Heading from "./components/heading";
import Input from "./components/input";
import Textarea from "./components/textarea";
import Tooltip from "./components/tooltip";
import { extendTheme } from "@chakra-ui/react";

const theme = {
  components: {
    Heading,
    Input,
    Textarea,
    Tooltip
  },
  config: {
    initialColorMode: "dark",
    useSystemColorMode: false
  }
};

export default extendTheme(theme);
