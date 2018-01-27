import React from 'react';
import FontAwesome from 'react-fontawesome';
import '../style/footer.css';

const today = new Date();
const year = today.getFullYear();

const networkLinks = () => {
  if (
    process.env.NODE_ENV !== 'production' ||
    process.env.REACT_APP_NEM_NETWORK === 'testnet'
  ) {
    return (
      <p className="text-center">
        Currently running on the NEM testnet. Want to try the{' '}
        <a href="https://nemp3v2.herokuapp.com/">mainnet version</a>?
      </p>
    );
  } else if (process.env.REACT_APP_NEM_NETWORK === 'mainnet') {
    return (
      <p className="text-center">
        Try the NEM{' '}
        <a href="https://nemp3v2-testnet.herokuapp.com/">testnet version.</a>
      </p>
    );
  }
};

const Footer = () => (
  <footer className="container-fluid">
    <div className="row">
      <div className="col">
        {networkLinks()}
        <small>
          <p className="text-center">
            &copy; {year !== 2017 && <span>2017&ndash;</span>}
            {year} <a href="http://ochremusic.com">Christopher Leary</a>
          </p>
        </small>
        <p className="text-center github">
          <a href="https://github.com/csleary/nemp3v2">
            <FontAwesome name="github" className="icon-left" />
          </a>
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
