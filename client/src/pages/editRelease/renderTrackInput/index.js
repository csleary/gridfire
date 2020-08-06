import AudioDropzone from 'pages/editRelease/audioDropzone';
import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';
import styles from './renderTrackInput.module.css';

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
    [styles.invalid]: touched && error
  });

  return (
    <>
      <div className={styles.wrapper}>
        <label className={styles.label} htmlFor={name}>
          {label}
        </label>
        <input
          className={inputClasses}
          onDrop={() => false}
          id={name}
          name="trackTitle"
          placeholder={`Track ${label} Title`}
          required
          type={type}
          {...input}
        />
        <AudioDropzone trackId={trackId} disablePreview />
      </div>
      {error ? <div className={styles.feedback}>{touched && error}</div> : null}
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
