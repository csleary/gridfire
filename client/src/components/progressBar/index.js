import PropTypes from 'prop-types';
import React from 'react';
import classnames from 'classnames';
import styles from './progressBar.module.css';

const ProgressBar = ({ className, percentComplete, willDisplay }) => {
  if (willDisplay) {
    return (
      <div
        className={classnames(styles.root, { [className]: Boolean(classnames) })}
        style={{ width: `${percentComplete}%` }}
      />
    );
  }
  return null;
};

ProgressBar.propTypes = {
  percentComplete: PropTypes.number,
  willDisplay: PropTypes.bool
};

export default ProgressBar;
