import { spinner, wrapper } from './spinner.module.css';
import PropTypes from 'prop-types';
import React from 'react';
import classnames from 'classnames';

const Spinner = ({ children, className, wrapperClassName }) => (
  <div
    className={classnames(
      'container',
      { [wrapper]: !wrapperClassName },
      { [wrapperClassName]: Boolean(wrapperClassName) }
    )}
  >
    {children}
    <div className={classnames(spinner, { [className]: Boolean(className) })} />
  </div>
);

Spinner.propTypes = {
  children: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
  className: PropTypes.string,
  wrapperClassName: PropTypes.string
};

export default Spinner;
