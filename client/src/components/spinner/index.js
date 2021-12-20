import PropTypes from 'prop-types';
import React from 'react';
import classnames from 'classnames';
import styles from './spinner.module.css';

const Spinner = ({ children, className, wrapperClassName }) => (
  <div
    className={classnames(
      'container',
      { [styles.wrapper]: !wrapperClassName },
      { [wrapperClassName]: Boolean(wrapperClassName) }
    )}
  >
    {children}
    <div className={classnames(styles.spinner, { [className]: Boolean(className) })} />
  </div>
);

Spinner.propTypes = {
  children: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
  className: PropTypes.string,
  wrapperClassName: PropTypes.string
};

export default Spinner;
