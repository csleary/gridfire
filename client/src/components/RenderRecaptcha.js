import React from 'react';
import Recaptcha from 'react-google-recaptcha';

const sitekey = process.env.REACT_APP_RECAPTCHA_SITE_KEY;

class RenderRecaptcha extends React.Component {
  reset() {
    const captcha = this.captcha;
    captcha.reset();
  }

  render() {
    const { error, input, touched } = this.props;
    const classNames = this.props.classNames || 'justify-content-end';

    return (
      <div className={`form-group d-flex flex-wrap pt-3 ${classNames}`}>
        <Recaptcha
          onChange={response => input.onChange(response)}
          ref={el => {
            this.captcha = el;
          }}
          sitekey={sitekey}
        />
        {touched && error && (
          <div className="invalid-feedback">{touched && error && error}</div>
        )}
      </div>
    );
  }
}

export default RenderRecaptcha;
