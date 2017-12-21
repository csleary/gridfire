import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware } from 'redux';
import reduxThunk from 'redux-thunk';
import App from './components/App';
import reducers from './reducers';
import './style/index.css';

const socketMiddleWare = store => next => (action) => {
  const { dispatch } = store;
  // Socket client.
  if (action.type === 'SOCKET_TX_UNCONFIRMED') {
    dispatch({
      type: 'SOCKET_TX_UNCONFIRMED',
      payload: action.data
    });
  }

  next(action);
};

const store = createStore(
  reducers,
  {},
  applyMiddleware(reduxThunk, socketMiddleWare)
);

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root')
);
