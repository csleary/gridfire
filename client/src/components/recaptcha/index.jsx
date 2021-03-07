import GoogleRecaptcha from 'react-google-recaptcha';
import PropTypes from 'prop-types';
import React from 'react';
import styles from './recaptcha.module.css';
const sitekey = process.env.REACT_APP_RECAPTCHA_SITE_KEY;

const Recaptcha = ({ error, onChange, name = 'recaptcha', onError, captchaRef }) => {
  return (
    <div className={styles.root}>
      <div className={styles.captcha}>
        <GoogleRecaptcha
          onChange={value => onChange({ target: { name, value } })}
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
  onChange: PropTypes.func,
  name: PropTypes.string,
  onError: PropTypes.func
};

export default Recaptcha;
