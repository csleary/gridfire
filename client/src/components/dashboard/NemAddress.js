import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux';
import { Field, formValueSelector, reduxForm } from 'redux-form';
import FontAwesome from 'react-fontawesome';
import classnames from 'classnames';
import nem from 'nem-sdk';
import { fetchUserCredit, toastSuccess, toastWarning } from '../../actions';

const addressPrefix =
  process.env.REACT_APP_NEM_NETWORK === 'mainnet' ? "an 'N'" : "a 'T'";

const FormInputs = props => {
  if (props.id === 'signedMessage') {
    return <textarea row="4" {...props} />;
  }
  return <input {...props} />;
};

class NemAddress extends Component {
  state = { isCheckingCredit: false };

  componentDidMount() {
    this.props.initialize({
      nemAddress: nem.utils.format.address(this.props.nemAddress)
    });
  }

  handleUpdateCredit = () => {
    this.setState({ isCheckingCredit: true });
    this.props.fetchUserCredit();
  };

  checkNemAddress = address => {
    if (address && !nem.model.address.isValid(address)) {
      return (
        <Fragment>
          <FontAwesome name="exclamation-circle" className="mr-2" />
          This doesn&rsquo;t appear to be a valid NEM address. Please
          double-check it!
        </Fragment>
      );
    }
    return undefined;
  };

  renderFormField = ({
    hint,
    id,
    input,
    label,
    name,
    placeholder,
    type,
    meta: { active, error, touched }
  }) => {
    const formGroupClassNames = classnames('form-group', {
      invalid: !active && touched && error
    });

    const inputClassNames = classnames('form-control', {
      'payment-address': id === 'nemAddress',
      'signed-message': id === 'signedMessage'
    });

    return (
      <div className={formGroupClassNames}>
        <label htmlFor={id}>{label}</label>
        {id === 'nemAddress' && this.renderAddressStatus()}
        <FormInputs
          {...input}
          className={inputClassNames}
          id={id}
          name={name}
          placeholder={placeholder}
          type={type}
        />
        <small className="form-text text-muted">{hint}</small>
        <div className="invalid-feedback">{touched && error && error}</div>
      </div>
    );
  };

  renderAddressStatus = () => {
    const { nemAddress, nemAddressVerified } = this.props;

    if (nemAddress && !nemAddressVerified) {
      return (
        <span
          className="status unconfirmed"
          title="Thank you for verifying your address."
        >
          Unverified
          <FontAwesome name="exclamation-circle" className="ml-2" />
        </span>
      );
    }

    if (nemAddress && nemAddressVerified) {
      return (
        <span className="status confirmed">
          Verified
          <FontAwesome name="check-circle" className="ml-2" />
        </span>
      );
    }
  };

  renderConfirmAddressField = () => {
    const { nemAddress, nemAddressVerified, submitting } = this.props;

    if (nemAddress && !nemAddressVerified) {
      return (
        <Fragment>
          <Field
            disabled={submitting}
            hint="This address has not yet been verified."
            id="signedMessage"
            label="Your Signed Message"
            name="signedMessage"
            placeholder={
              '{"message":"YOUR_MESSAGE","signer":"YOUR_PUBLIC_KEY","signature":"YOUR_SIGNATURE"}'
            }
            type="text"
            component={this.renderFormField}
          />
          <p>
            Please create a signed message in the desktop wallet app (Services
            &#8594; Signed message &#8594; Create a signed message), and
            copy/paste the results here to verify ownership of your account.
          </p>
          <p>
            It doesn&rsquo;t matter what you put in the message field, only that
            it is cryptographically signed by your private key.
          </p>
          <p>
            Once you have verified your account, you can add credit and start
            selling your music!
          </p>
        </Fragment>
      );
    }
  };

  renderButtonLabel = () => {
    const { nemAddress, nemAddressField, nemAddressVerified } = this.props;

    if (nemAddress && nemAddressField && !nemAddressVerified) {
      return 'Verify Address';
    }
    if (nemAddress && !nemAddressField) {
      return 'Remove Address';
    }
    return 'Save Address';
  };

  render() {
    const { credit, handleSubmit, pristine, submitting, invalid } = this.props;
    const userReleaseCount =
      (this.props.userReleases && this.props.userReleases.length) || 0;

    const creditClassName = classnames({
      red: !credit,
      yellow: credit
    });

    return (
      <main className="container">
        <div className="row">
          <div className="col-lg mb-5 py-3">
            <h3 className="text-center mt-4">NEM Payment Address</h3>
            <p className="text-center">
              Please add a NEM address if you wish to sell music, as fan
              payments and nemp3 credit will be sent directly to this address.
            </p>
            <form className="nem-address my-5 py-5" onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="col-md-9 mx-auto">
                  <Field
                    disabled={submitting}
                    id="nemAddress"
                    hint="It doesn&rsquo;t matter whether you include dashes or not."
                    label="Your NEM Address"
                    name="nemAddress"
                    placeholder={`NEM Address (should start with ${addressPrefix})`}
                    type="text"
                    component={this.renderFormField}
                    validate={this.checkNemAddress}
                  />
                  {this.renderConfirmAddressField()}
                  <div className="d-flex justify-content-end mb-5">
                    <button
                      type="submit"
                      className="btn btn-outline-primary btn-lg"
                      disabled={invalid || pristine || submitting}
                    >
                      {this.renderButtonLabel()}
                    </button>
                  </div>
                  <p>
                    <span className={creditClassName}>
                      <FontAwesome name="certificate" className="mr-1" />
                      Your credit balance is {credit || 0}.
                    </span>
                    <button
                      className="btn btn-outline-primary btn-sm mx-2"
                      disabled={this.state.isCheckingCredit}
                      onClick={this.handleUpdateCredit}
                      style={{ verticalAlign: 'bottom' }}
                      title={'Press to recheck your credit.'}
                    >
                      <FontAwesome
                        name="refresh"
                        className="mr-2"
                        spin={this.state.isCheckingCredit}
                      />
                      Refresh
                    </button>
                  </p>
                  <p>
                    As you have {userReleaseCount} release
                    {userReleaseCount === 1 ? '' : 's'}, you need to maintain a
                    credit balance of at least {userReleaseCount + 1} to be able
                    to add a new release or purchase perks.
                  </p>
                </div>
              </div>
            </form>
            <h4>Getting Your First NEM Address</h4>
            <p>
              To receive payments from fans, as well as (eventually) utility
              tokens or rewards from nemp3, you will need to have your own NEM
              address. The easiest way to do this is by setting up an account
              with one of the mobile wallets, which are available from your
              phone&rsquo;s respective download store, as linked from{' '}
              <a href="https://nem.io/downloads/">the NEM site</a>. Of course,
              there is a more fully-featured cross-platform desktop wallet also
              available.
            </p>
            <p>
              The mobile wallets are especially handy, as they are able to scan
              the QR codes on the payment pages using the device&rsquo;s camera,
              to fill in payment details automatically (which you can confirm
              before sending, naturally). This makes including the payment
              message code with your payment amount foolproof.
            </p>
            <p>
              Within any of the wallets, whether the desktop NanoWallet or the
              mobile wallets, you can create any number of accounts, each with
              their own individual address. You could easily dedicate an address
              to nemp3, for instance.
            </p>
            <p>
              At present, only a single NEM address can be added to nemp3
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

const fieldSelector = formValueSelector('nemAddressForm');

function mapStateToProps(state) {
  return {
    credit: state.user.credit,
    nemAddress: state.user.nemAddress,
    nemAddressField: fieldSelector(state, 'nemAddress'),
    nemAddressVerified: state.user.nemAddressVerified,
    userReleases: state.releases.userReleases
  };
}

export default reduxForm({
  form: 'nemAddressForm'
})(
  connect(
    mapStateToProps,
    { fetchUserCredit, toastSuccess, toastWarning }
  )(NemAddress)
);
