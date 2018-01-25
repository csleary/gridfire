import React from 'react';

const RenderReleaseField = ({
  formText,
  input,
  label,
  meta: { error, touched },
  name,
  type
}) => {
  const className = `form-group ${touched && error ? 'invalid' : ''}`;
  return (
    <div className={className}>
      <label htmlFor={name}>{label}</label>
      <input className="form-control" id={name} type={type} {...input} />
      {formText && <small className="form-text text-muted">{formText}</small>}
      {error && <div className="invalid-feedback">{touched && error}</div>}
    </div>
  );
};

export default RenderReleaseField;
