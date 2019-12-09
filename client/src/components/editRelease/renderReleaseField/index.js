import PropTypes from 'prop-types';
import React from 'react';

const RenderReleaseField = ({
  formText,
  input,
  label,
  meta: { error, touched },
  min,
  name,
  type
}) => {
  const className = `form-group ${touched && error ? 'invalid' : ''}`;

  return (
    <div className={className}>
      <label htmlFor={name}>{label}</label>
      {type === 'textarea' ? (
        <textarea className="form-control" id={name} rows="3" {...input} />
      ) : (
        <input
          className="form-control"
          id={name}
          type={type}
          min={min}
          {...input}
        />
      )}
      {formText && <small className="form-text text-muted">{formText}</small>}
      {error && <div className="invalid-feedback">{touched && error}</div>}
    </div>
  );
};

RenderReleaseField.propTypes = {
  error: PropTypes.string,
  formText: PropTypes.string,
  input: PropTypes.object,
  label: PropTypes.string,
  meta: PropTypes.object,
  name: PropTypes.string,
  touched: PropTypes.string,
  type: PropTypes.string
};

export default RenderReleaseField;
