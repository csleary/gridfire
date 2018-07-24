import React, { Component, Fragment } from 'react';
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
        <Fragment>
          <FontAwesome name="exclamation-circle" className="icon-left" />
          This doesn&rsquo;t appear to be a valid NEM address. Please
          double-check it!
        </Fragment>
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
            <h3 className="text-center mt-4">NEM Payment Address</h3>
            <p className="text-center">
              Please add a NEM address if you wish to sell music, as fan
              payments will be sent directly to this address.
            </p>
            <form onSubmit={handleSubmit(this.onSubmit)}>
              <div className="form-row mt-5">
                <div className="col-md-9 mx-auto">
                  <Field
                    disabled={submitting}
                    id="nemAddress"
                    label="Your NEM Address"
                    name="nemAddress"
                    type="text"
                    component={this.renderNemAddressField}
                    validate={this.checkNemAddress}
                  />
                  <div className="d-flex justify-content-center">
                    <button
                      type="submit"
                      className="btn btn-outline-primary btn-lg"
                      disabled={invalid || pristine || submitting}
                    >
                      Save Address
                    </button>
                  </div>
                </div>
              </div>
            </form>
            <h4>Getting Your First NEM Address</h4>
            <p>
              To receive payments from fans, as well as (eventually) utility
              tokens or rewards from NEMp3, you will need to have your own NEM
              address. The easiest way to do this is by setting up an account
              with one of the mobile wallets, which are available from your
              phone&rsquo;s respective download store, as linked from{' '}
              <a href="https://nem.io/downloads/">the NEM site</a>. Of course,
              there is a more fully-featured cross-platform desktop wallet also
              available.
            </p>
            <p>
              The mobile wallets are especially handy, as they are able to scan
              the QR codes on the payment pages with their cameras, to fill in
              payment details automatically (which you can confirm before
              sending, naturally). This makes including the payment message code
              with your payment amount foolproof.
            </p>
            <p>
              Within any of the wallets, whether the desktop NanoWallet or the
              mobile wallets, you can create any number of accounts, each with
              their own individual address. You could easily dedicate an address
              to NEMp3, for instance.
            </p>
            <p>
              At present, only a single NEM address can be added to NEMp3
              accounts, so for example, automatic royalty splits are not yet
              possible (and would incur a network fee for royalties sent to each
              band member). This may change with the next update of the NEM
              infrastructure.
            </p>
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
  connect(
    mapStateToProps,
    { addNemAddress, fetchUser, toastMessage }
  )(Dashboard)
);
