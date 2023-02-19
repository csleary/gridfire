import * as serviceWorker from "serviceWorker";
import { ChakraProvider, ColorModeScript } from "@chakra-ui/react";
import App from "./App";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { createRoot } from "react-dom/client";
import { createStandaloneToast } from "@chakra-ui/toast";
import rootReducer from "state";
import theme from "./theme";

declare const window: any; // eslint-disable-line

const store = configureStore({
  reducer: rootReducer,
  middleware: getDefaultMiddleware => getDefaultMiddleware({ immutableCheck: false, serializableCheck: false })
});

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

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
