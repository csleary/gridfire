import FontAwesome from 'react-fontawesome';
import PropTypes from 'prop-types';
import React from 'react';
import classnames from 'classnames';
import styles from '../nemAddress.module.css';

const FormInputs = props => {
  if (props.id === 'signedMessage') {
    return <textarea row="4" {...props} />;
  }
  return <input {...props} />;
};

const NemAddressFormField = ({
  hint,
  id,
  input,
  label,
  nemAddress,
  nemAddressVerified,
  placeholder,
  type,
  meta: { active, error, touched }
}) => {
  const formGroupClassNames = classnames('form-group', {
    invalid: !active && touched && error
  });

  const inputClassNames = classnames('form-control', {
    [styles.address]: id === 'nemAddress',
    [styles.message]: id === 'signedMessage'
  });

  const renderAddressStatus = () => {
    if (nemAddress && !nemAddressVerified) {
      return (
        <span
          className={styles.unconfirmed}
          title="Please sign a message to verify your address."
        >
          Unverified
          <FontAwesome name="exclamation-circle" className="ml-2" />
        </span>
      );
    }

    if (nemAddress && nemAddressVerified) {
      return (
        <span
          className={styles.confirmed}
          title="Thank you for verifying your address."
        >
          Verified
          <FontAwesome name="check-circle" className="ml-2" />
        </span>
      );
    }
  };

  return (
    <div className={formGroupClassNames}>
      <label htmlFor={id}>{label}</label>
      {id === 'nemAddress' && renderAddressStatus()}
      <FormInputs
        {...input}
        className={inputClassNames}
        id={id}
        placeholder={placeholder}
        type={type}
      />
      <small className="form-text text-muted">{hint}</small>
      {touched && error && (
        <div className="invalid-feedback">
          <FontAwesome name="exclamation-circle" className="mr-2" />
          {error}
        </div>
      )}
    </div>
  );
};

FormInputs.propTypes = {
  id: PropTypes.string
};

NemAddressFormField.propTypes = {
  active: PropTypes.bool,
  error: PropTypes.bool,
  hint: PropTypes.string,
  id: PropTypes.string,
  input: PropTypes.object,
  label: PropTypes.string,
  meta: PropTypes.object,
  nemAddress: PropTypes.string,
  nemAddressVerified: PropTypes.bool,
  name: PropTypes.string,
  placeholder: PropTypes.string,
  touched: PropTypes.bool,
  type: PropTypes.string
};

export default NemAddressFormField;
