import FontAwesome from 'react-fontawesome';
import React from 'react';
import classnames from 'classnames';
import styles from './inputField.module.css';

const InputField = field => {
  const {
    hint,
    icon,
    id,
    input,
    label,
    meta: { touched, error },
    name,
    placeholder,
    required,
    rows,
    type
  } = field;

  const iconClassNames = classnames(styles.icon, { red: touched && error, yellow: touched && !error, cyan: !touched });

  return (
    <div className="form-group">
      <label htmlFor={id}>
        <FontAwesome name={icon} className={iconClassNames} />
        {label}
      </label>
      {type === 'textarea' ? (
        <textarea
          {...input}
          className="form-control"
          name={name}
          placeholder={placeholder}
          required={required}
          rows={rows}
        />
      ) : (
        <input
          {...input}
          className="form-control"
          name={name}
          placeholder={placeholder}
          required={required}
          type={type}
        />
      )}
      {touched && error ? <div className="invalid-feedback">{error}</div> : null}
      {hint ? <small className="form-text text-muted">{hint}</small> : null}
    </div>
  );
};

export default InputField;
