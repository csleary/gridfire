import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Field, reduxForm } from 'redux-form';
import FontAwesome from 'react-fontawesome';
import nem from 'nem-sdk';
import { addNemAddress, fetchUser, toastMessage } from '../../actions';

const addressPrefix =
  process.env.REACT_APP_NEM_NETWORK === 'mainnet' ? "an 'N'" : "a 'T'";

class Dashboard extends Component {
  componentDidMount() {
    this.props.initialize({
      nemAddress: nem.utils.format.address(this.props.nemAddress)
    });
  }

  onSubmit = values => {
    this.props.addNemAddress(values).then(() =>
      this.props.toastMessage({
        alertClass: 'alert-success',
        message: 'NEM payment address updated.'
      })
    );
  };

  checkNemAddress = address => {
    if (address && !nem.model.address.isValid(address)) {
      return (
        <div>
          <FontAwesome name="exclamation-circle" className="icon-left" />
          This doesn&rsquo;t appear to be a valid NEM address. Please
          double-check it!
        </div>
      );
    }
    return undefined;
  };

  renderNemAddressField = ({
    id,
    input,
    label,
    name,
    type,
    meta: { active, error, touched }
  }) => {
    const className = `form-group ${
      !active && touched && error ? 'invalid' : ''
    }`;
    return (
      <div className={className}>
        <label htmlFor={id}>{label}</label>
        <input
          {...input}
          className="form-control payment-address"
          name={name}
          placeholder={`NEM Address (should start with ${addressPrefix})`}
          type={type}
        />
        <small className="form-text text-muted">
          It doesn&rsquo;t matter whether you include dashes or not.
        </small>
        <div className="invalid-feedback">{touched && error && error}</div>
      </div>
    );
  };

  render() {
    const { handleSubmit, pristine, submitting, invalid } = this.props;

    return (
      <main className="container">
        <div className="row">
          <div className="col-lg">
            <h3>Payment Address</h3>
            <p>
              Please add your NEM address if you wish to sell music. This
              won&rsquo;t be necessary if you only plan on purchasing music.
            </p>
            <form onSubmit={handleSubmit(this.onSubmit)}>
              <Field
                disabled={submitting}
                id="nemAddress"
                label="NEM Address"
                name="nemAddress"
                type="text"
                component={this.renderNemAddressField}
                validate={this.checkNemAddress}
              />
              <div className="d-flex justify-content-end">
                <button
                  type="submit"
                  className="btn btn-outline-primary btn-lg"
                  disabled={invalid || pristine || submitting}
                >
                  Save Address
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    );
  }
}

function mapStateToProps(state) {
  return {
    nemAddress: state.user.nemAddress
  };
}

export default reduxForm({
  form: 'nemAddressForm'
})(
  connect(mapStateToProps, { addNemAddress, fetchUser, toastMessage })(
    Dashboard
  )
);
