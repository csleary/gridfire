import { createStandaloneToast } from "@chakra-ui/toast";
import theme from "theme";

const { toast } = createStandaloneToast({
  defaultOptions: {
    position: "top-center",
    duration: 5000,
    isClosable: false
  },
  theme
});

const toastError =
  ({ message, title }) =>
  () => {
    toast({ description: message, duration: 10000, isClosable: true, status: "error", title });
  };

const toastInfo =
  ({ message, title }) =>
  () => {
    toast({ description: message, status: "info", title });
  };

const toastSuccess =
  ({ message, title }) =>
  () => {
    toast({ description: message, status: "success", title });
  };

const toastWarning =
  ({ message, title }) =>
  () => {
    toast({ description: message, status: "warning", title });
  };

export { toastInfo, toastError, toastSuccess, toastWarning };
