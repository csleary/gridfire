import PropTypes from 'prop-types';
import React from 'react';
import Toast from './toast';
import { connect } from 'react-redux';
import styles from './toast.module.css';

const ToastList = ({ toastList }) => {
  const renderList = () =>
    toastList.map(toast => <Toast key={toast.key} toast={toast} />);

  return <div className={styles.list}>{renderList()}</div>;
};

const mapStateToProps = state => ({
  toastList: state.toastList
});

ToastList.propTypes = {
  toastList: PropTypes.array
};

export default connect(mapStateToProps)(ToastList);
