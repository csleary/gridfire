import { createStandaloneToast } from "@chakra-ui/toast";
import theme from "theme";

const { toast } = createStandaloneToast({
  defaultOptions: {
    position: "top",
    duration: 5000,
    isClosable: false
  },
  theme
});

interface Toast {
  message: string;
  title?: string;
}

type ToastCreator = (toast: Toast) => () => void;

const toastError: ToastCreator =
  ({ message, title }) =>
  () => {
    toast({ description: message, duration: 10000, isClosable: true, status: "error", title });
  };

const toastInfo: ToastCreator =
  ({ message, title }) =>
  () => {
    toast({ description: message, status: "info", title });
  };

const toastSuccess: ToastCreator =
  ({ message, title }) =>
  () => {
    toast({ description: message, status: "success", title });
  };

const toastWarning: ToastCreator =
  ({ message, title }) =>
  () => {
    toast({ description: message, status: "warning", title });
  };

export { toastInfo, toastError, toastSuccess, toastWarning };
