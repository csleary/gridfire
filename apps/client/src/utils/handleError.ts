import axios from "axios";

import { AppDispatch } from "@/types";

import { toastError } from "../state/toast";

const handleError = (error: unknown, dispatch: AppDispatch, message?: string) => {
  if (axios.isCancel(error)) {
    return;
  }

  console.error(error);

  if (axios.isAxiosError(error)) {
    return void dispatch(toastError({ message: message ?? error.response?.data.error, title: "Error" }));
  }

  if (error instanceof Error) {
    return void dispatch(toastError({ message: message ?? error.message, title: "Error" }));
  }

  return void dispatch(
    toastError({ message: message ?? "An error occurred while processing your request.", title: "Error" })
  );
};

export default handleError;
