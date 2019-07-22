import FontAwesome from 'react-fontawesome';
import React from 'react';
import classnames from 'classnames';
import styles from '../../style/NemAddress.module.css';

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
  name,
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
          title="Thank you for verifying your address."
        >
          Unverified
          <FontAwesome name="exclamation-circle" className="ml-2" />
        </span>
      );
    }

    if (nemAddress && nemAddressVerified) {
      return (
        <span className={styles.confirmed}>
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
        name={name}
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

export default NemAddressFormField;
