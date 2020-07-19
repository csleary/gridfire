import AudioDropzone from 'components/editRelease/audioDropzone';
import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';

const RenderTrackInput = props => {
  const {
    input,
    label,
    meta: { touched, error },
    name,
    trackId,
    type
  } = props;
  const inputClasses = classNames('form-control', {
    invalid: touched && error
  });

  return (
    <>
      <div className="d-flex align-items-center">
        <label htmlFor={name}>{label}</label>
        <input
          className={inputClasses}
          id={name}
          name="trackTitle"
          placeholder={`Track ${label} Title`}
          required
          type={type}
          {...input}
        />
        <AudioDropzone trackId={trackId} disablePreview />
      </div>
      {error ? <div className="invalid-feedback">{touched && error}</div> : null}
    </>
  );
};

RenderTrackInput.propTypes = {
  input: PropTypes.object,
  dragActive: PropTypes.bool,
  label: PropTypes.number,
  meta: PropTypes.object,
  touched: PropTypes.bool,
  error: PropTypes.bool,
  name: PropTypes.string,
  trackId: PropTypes.string,
  type: PropTypes.string
};

export default RenderTrackInput;
