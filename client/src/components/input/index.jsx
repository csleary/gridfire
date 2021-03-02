import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import styles from './input.module.css';

const Input = ({
  autoFocus,
  className,
  disabled,
  element,
  error,
  hint,
  icon,
  label,
  name,
  onBlur,
  onChange,
  onKeyDown,
  placeholder,
  required,
  rows,
  type,
  value
}) => {
  const [isTouched, setIsTouched] = useState(false);

  return (
    <div className="form-group">
      {label && typeof label === 'string' ? (
        <label htmlFor={name}>
          {icon ? (
            <FontAwesomeIcon
              icon={icon}
              className={classnames(styles.icon, {
                red: isTouched && error,
                yellow: isTouched && !error,
                cyan: !isTouched
              })}
            />
          ) : null}
          {label}
        </label>
      ) : (
        label
      )}
      {element === 'textarea' ? (
        <textarea
          className="form-control"
          disabled={disabled}
          name={name}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          rows={rows}
          value={value}
        />
      ) : (
        <input
          autoFocus={autoFocus}
          className={classnames('form-control', styles.input, { [className]: Boolean(className) })}
          disabled={disabled}
          name={name}
          onBlur={onBlur}
          onChange={onChange}
          onKeyDown={onKeyDown}
          onFocus={() => setIsTouched(true)}
          placeholder={placeholder}
          required={required}
          type={type}
          value={value}
        />
      )}
      {hint ? <small className="form-text text-muted">{hint}</small> : null}
      {isTouched && error ? <div className={styles.error}>{error}</div> : null}
    </div>
  );
};

Input.propTypes = {
  autoFocus: PropTypes.bool,
  className: PropTypes.string,
  element: PropTypes.string,
  disabled: PropTypes.bool,
  error: PropTypes.string,
  hint: PropTypes.string,
  icon: PropTypes.object,
  label: PropTypes.oneOfType([PropTypes.node, PropTypes.string]),
  name: PropTypes.string,
  onBlur: PropTypes.func,
  onChange: PropTypes.func,
  onKeyDown: PropTypes.func,
  placeholder: PropTypes.string,
  required: PropTypes.bool,
  rows: PropTypes.number,
  type: PropTypes.string,
  value: PropTypes.string
};

export default Input;
