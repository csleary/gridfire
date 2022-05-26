import Alert from "./components/alert";
import Heading from "./components/heading";
import Input from "./components/input";
import Textarea from "./components/textarea";
import { extendTheme } from "@chakra-ui/react";

const config = {
  initialColorMode: "dark",
  useSystemColorMode: false,
  components: {
    Alert,
    Heading,
    Input,
    Textarea
  }
};

export default extendTheme(config);
