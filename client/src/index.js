import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';
import reduxThunk from 'redux-thunk';
import 'bootstrap/dist/css/bootstrap.css';
import '@ibm/type/css/ibm-type.min.css';
import App from './components/App';
import * as serviceWorker from './serviceWorker';
import rootReducer from './reducers';
import './style/index.css';

const CLOUD_URL = 'https://d2gjz4j3cdttft.cloudfront.net';

const store = createStore(rootReducer, {}, applyMiddleware(reduxThunk));

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

export { CLOUD_URL, CLOUD_URL as default };
