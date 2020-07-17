import 'bootstrap/dist/css/bootstrap.min.css';
import * as serviceWorker from 'serviceWorker';
import { configureStore, getDefaultMiddleware } from '@reduxjs/toolkit';
import App from './App';
import { Provider } from 'react-redux';
import React from 'react';
import ReactDOM from 'react-dom';
import rootReducer from 'features';
import socketMiddleware from 'middleware/socket';

const CLOUD_URL = 'https://d2gjz4j3cdttft.cloudfront.net';

const store = configureStore({
  reducer: rootReducer,
  middleware: [...getDefaultMiddleware({ immutableCheck: false, serializableCheck: false }), socketMiddleware]
});

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();

export { CLOUD_URL };
