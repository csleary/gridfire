import React from 'react';
import Toast from './Toast';
import { connect } from 'react-redux';
import styles from '../style/Toast.module.css';

const ToastList = ({ toastList }) => {
  const renderList = () =>
    toastList.map(toast => <Toast key={toast.key} toast={toast} />);

  return <div className={styles.list}>{renderList()}</div>;
};

const mapStateToProps = state => ({
  toastList: state.toastList
});

export default connect(mapStateToProps)(ToastList);
