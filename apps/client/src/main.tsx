import { ChakraProvider, ColorModeScript } from "@chakra-ui/react";
import { createStandaloneToast } from "@chakra-ui/toast";
import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";

import App from "@/App";
import rootReducer from "@/state";
import { logsApi } from "@/state/logs";

import theme from "./theme";

const store = configureStore({
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({ immutableCheck: true, serializableCheck: true }).concat(logsApi.middleware),
  reducer: rootReducer
});

setupListeners(store.dispatch);
const container = document.getElementById("root")!;
const root = createRoot(container);
const { ToastContainer } = createStandaloneToast();

root.render(
  <Provider store={store}>
    <ChakraProvider theme={theme}>
      <ColorModeScript initialColorMode={theme.config.initialColorMode} />
      <App />
      <ToastContainer />
    </ChakraProvider>
  </Provider>
);

export { store };
