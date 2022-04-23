import * as serviceWorker from "serviceWorker";
import { configureStore } from "@reduxjs/toolkit";
import App from "./App";
import { ChakraProvider, ColorModeScript } from "@chakra-ui/react";
import { Provider } from "react-redux";
import React from "react";
import { createRoot } from "react-dom/client";
import { ethers } from "ethers";
import rootReducer from "features";
import theme from "./theme";

const { REACT_APP_IPFS_GATEWAY, REACT_APP_NETWORK_URL } = process.env;
const CLOUD_URL = `${REACT_APP_IPFS_GATEWAY}`;
declare const window: any; // eslint-disable-line

const store = configureStore({
  reducer: rootReducer,
  middleware: getDefaultMiddleware => getDefaultMiddleware({ immutableCheck: false, serializableCheck: false })
});

//ethers.providers.AlchemyProvider(chainId, [apiKey]) // For prod
const provider = new ethers.providers.JsonRpcProvider(REACT_APP_NETWORK_URL);
const Web3Context = React.createContext(provider);
const container = document.getElementById("root")!;
const root = createRoot(container);

root.render(
  <Provider store={store}>
    <Web3Context.Provider value={provider}>
      <ChakraProvider theme={theme}>
        <ColorModeScript initialColorMode={theme.config.initialColorMode} />
        <App />
      </ChakraProvider>
    </Web3Context.Provider>
  </Provider>
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();

export { CLOUD_URL, Web3Context };
export type RootState = ReturnType<typeof store.getState>;
