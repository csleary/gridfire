import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';
import reduxThunk from 'redux-thunk';
import 'bootstrap/dist/css/bootstrap.css';
import '@ibm/type/css/ibm-type.min.css';
import App from './components/App';
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

export { CLOUD_URL as default };
