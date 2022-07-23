import Heading from "./components/heading";
import Input from "./components/input";
import Textarea from "./components/textarea";
import { extendTheme } from "@chakra-ui/react";

const theme = {
  components: {
    Heading,
    Input,
    Textarea
  },
  config: {
    initialColorMode: "dark",
    useSystemColorMode: false
  }
};

export default extendTheme(theme);
