import Alert from "./components/alert";
import Heading from "./components/heading";
import Input from "./components/input";
import Progress from "./components/progress";
import Textarea from "./components/textarea";
import { extendTheme } from "@chakra-ui/react";

const config = {
  initialColorMode: "dark",
  useSystemColorMode: false,
  components: {
    Alert,
    Heading,
    Input,
    Progress,
    Textarea
  }
};

export default extendTheme(config);
