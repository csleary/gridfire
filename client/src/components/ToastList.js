import React, { useEffect, useReducer } from 'react';
import { connect } from 'react-redux';
import Toast from './Toast';
import { usePrevious } from '../functions';

const initialState = { messages: [], isVisible: [] };

function reducer(state, action) {
  switch (action.type) {
  case 'addMessage':
    return {
      messages: [...state.messages, action.message],
      isVisible: [...state.isVisible, action.message.key]
    };
  case 'filterVisible':
    return {
      ...state,
      isVisible: state.isVisible.filter(el => el !== action.key)
    };
  default:
    throw new Error();
  }
}

const ToastList = ({ toastList }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const prevLength = usePrevious(toastList.length) || 1;
  const { messages } = state;

  useEffect(() => {
    if (toastList.length > prevLength) {
      const message = toastList[0];
      const { key } = message;
      dispatch({ type: 'addMessage', message });
      const timer = () =>
        setTimeout(() => dispatch({ type: 'filterVisible', key }), 5000);
      timer();
    }
  }, [prevLength, toastList]);

  const renderList = () =>
    messages.map(toast => (
      <Toast
        isVisible={state.isVisible.some(el => el === toast.key)}
        key={toast.key}
        toast={toast}
      />
    ));

  return <div className="toast-list">{renderList()}</div>;
};

const mapStateToProps = state => ({
  toastList: state.toastList
});

export default connect(mapStateToProps)(ToastList);
