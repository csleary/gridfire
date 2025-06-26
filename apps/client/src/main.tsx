import App from "@/App";
import rootReducer from "@/state";
import { logsApi } from "@/state/logs";
import { ChakraProvider, ColorModeScript } from "@chakra-ui/react";
import { createStandaloneToast } from "@chakra-ui/toast";
import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import theme from "./theme";

const store = configureStore({
  reducer: rootReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({ immutableCheck: true, serializableCheck: true }).concat(logsApi.middleware)
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

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type GetState = () => RootState;
export { store };
