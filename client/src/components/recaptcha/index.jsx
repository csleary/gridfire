import GoogleRecaptcha from 'react-google-recaptcha';
import PropTypes from 'prop-types';
import React from 'react';
import styles from './recaptcha.module.css';
const sitekey = process.env.REACT_APP_RECAPTCHA_SITE_KEY;

const Recaptcha = ({ error, handleChange, name = 'recaptcha', onError, captchaRef }) => {
  return (
    <div className={styles.root}>
      <div className={styles.captcha}>
        <GoogleRecaptcha
          onChange={value => handleChange({ target: { name, value } })}
          onErrored={onError}
          ref={el => (captchaRef.current = el)}
          sitekey={sitekey}
        />
      </div>
      {error ? <div className={styles.error}>{error}</div> : null}
    </div>
  );
};

Recaptcha.propTypes = {
  captchaRef: PropTypes.object,
  error: PropTypes.string,
  handleChange: PropTypes.func,
  name: PropTypes.string,
  onError: PropTypes.func
};

export default Recaptcha;
