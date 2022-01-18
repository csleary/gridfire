import { extendTheme } from "@chakra-ui/react";

// Component style overrides
import Heading from "./components/heading";
import Input from "./components/input";
import Progress from "./components/progress";
import Textarea from "./components/textarea";

const overrides = {
  components: {
    Heading,
    Input,
    Progress,
    Textarea
  }
};

export default extendTheme(overrides);
