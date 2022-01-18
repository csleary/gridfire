import * as serviceWorker from "serviceWorker";
import { configureStore, getDefaultMiddleware } from "@reduxjs/toolkit";
import App from "./App";
import { ChakraProvider } from "@chakra-ui/react";
import { Provider } from "react-redux";
import React from "react";
import ReactDOM from "react-dom";
import { ethers } from "ethers";
import rootReducer from "features";
import socketMiddleware from "middleware/socket";
import theme from "./theme";

const { REACT_APP_CLOUDFRONT, REACT_APP_NETWORK_URL } = process.env;
const CLOUD_URL = `https://${REACT_APP_CLOUDFRONT}`;
declare const window: any; // eslint-disable-line

const store = configureStore({
  reducer: rootReducer,
  middleware: [...getDefaultMiddleware({ immutableCheck: false, serializableCheck: false }), socketMiddleware]
});

//ethers.providers.AlchemyProvider(chainId, [apiKey]) // For prod
const provider = new ethers.providers.JsonRpcProvider(REACT_APP_NETWORK_URL);
const Web3Context = React.createContext(provider);

ReactDOM.render(
  <Provider store={store}>
    <Web3Context.Provider value={provider}>
      <ChakraProvider theme={theme}>
        <App />
      </ChakraProvider>
    </Web3Context.Provider>
  </Provider>,
  document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();

export { CLOUD_URL, Web3Context };
export type RootState = ReturnType<typeof store.getState>;
