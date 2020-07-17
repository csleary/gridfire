import { shallowEqual, useSelector } from 'react-redux';
import React from 'react';
import Toast from './toast';
import styles from './toast.module.css';

const ToastList = () => {
  const { messages } = useSelector(state => state.toast, shallowEqual);
  const renderList = () => messages.map(toast => <Toast key={toast.key} toast={toast} />);
  return <div className={styles.list}>{renderList()}</div>;
};

export default ToastList;
