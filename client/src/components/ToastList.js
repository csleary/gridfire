import React from 'react';
import { connect } from 'react-redux';
import Toast from './Toast';

const ToastList = ({ toastList }) => {
  const renderList = () =>
    toastList.map(toast => <Toast key={toast.key} toast={toast} />);

  return <div className="toast-list">{renderList()}</div>;
};

const mapStateToProps = state => ({
  toastList: state.toastList
});

export default connect(mapStateToProps)(ToastList);
