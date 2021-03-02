import React, { useRef, useState } from 'react';
import { faComment, faEnvelope } from '@fortawesome/free-regular-svg-icons';
import { toastError, toastSuccess } from 'features/toast';
import Button from 'components/button';
import { Helmet } from 'react-helmet';
import Input from 'components/input';
import Recaptcha from 'components/recaptcha';
import axios from 'axios';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { useDispatch } from 'react-redux';

const Contact = () => {
  const dispatch = useDispatch();
  const captchaRef = useRef();
  const [errors, setErrors] = useState({});
  const [isPristine, setIsPristine] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [values, setValues] = useState({});
  const hasErrors = Object.values(errors).some(error => Boolean(error));

  const handleChange = e => {
    const { name, value } = e.target;
    setIsPristine(false);

    setErrors(prev => {
      if (prev[name]) {
        const next = { ...prev };
        delete next[name];
        return next;
      }

      return prev;
    });

    setValues(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const validationErrors = validate(values);
    if (Object.values(validationErrors).some(error => Boolean(error))) return setErrors(validationErrors);
    setIsSubmitting(true);

    try {
      const res = await axios.post('/api/email/contact', values);
      dispatch(toastSuccess(res.data.success));
      setValues({});
    } catch (error) {
      dispatch(toastError(error.response.data.error));
    } finally {
      setIsSubmitting(false);
      captchaRef.current.reset();
    }
  };

  return (
    <main className="container">
      <Helmet>
        <title>Contact Us</title>
        <meta name="description" content="Get in touch with the nemp3 team." />
      </Helmet>
      <div className="row">
        <div className="col py-3 mb-4">
          <h2 className="text-center mt-4">Contact Us</h2>
          <p>
            Please get in touch using the contact form below if you have any queries, suggestions, or need help with
            anything. We&rsquo;ll be in touch as soon as possible.
          </p>
          <form className="form-row mt-5" onSubmit={handleSubmit}>
            <div className="col-md-6 mx-auto">
              <Input
                error={errors.email}
                icon={faEnvelope}
                label="Email Address:"
                name="email"
                onChange={handleChange}
                placeholder="Email Address"
                type="email"
                required
                value={values.password || ''}
              />
              <Input
                error={errors.message}
                icon={faComment}
                label="Your Message:"
                name="message"
                onChange={handleChange}
                placeholder="Enter your message."
                rows="6"
                type="textarea"
                required
                value={values.password || ''}
              />
              <Recaptcha
                error={errors.recaptcha}
                handleChange={handleChange}
                name={'recaptcha'}
                onError={error => setErrors(prev => ({ ...prev, recaptcha: String(error) }))}
                captchaRef={captchaRef}
              />
              <div className="d-flex justify-content-end">
                <Button
                  className="my-3"
                  icon={faCheck}
                  type="submit"
                  disabled={hasErrors || isPristine || isSubmitting}
                >
                  Send Message
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
};

const validate = ({ email, message, recaptcha }) => {
  const errors = {};
  if (!email) errors.email = 'Please enter your email address.';
  if (!message) errors.message = 'Please enter a message.';
  if (!recaptcha) errors.recaptcha = 'Please complete the recaptcha.';
  return errors;
};

export default Contact;
