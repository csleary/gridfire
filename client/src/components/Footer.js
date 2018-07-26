import React from 'react';
import { Link } from 'react-router-dom';
import FontAwesome from 'react-fontawesome';
import '../style/footer.css';

const today = new Date();
const year = today.getFullYear();

const networkLinks = () => {
  if (
    process.env.REACT_APP_NEM_NETWORK === 'testnet' ||
    process.env.NODE_ENV === 'development'
  ) {
    return <a href="https://nemp3.app/">Mainnet version</a>;
  }
  return <a href="https://nemp3v2-testnet.herokuapp.com/">Testnet version</a>;
};

const Footer = props => (
  <footer className="container-fluid">
    <div className="row justify-content-center">
      <div className="col-sm-2">
        <ul>
          <li>
            <Link to={'/about'}>About</Link>
          </li>
          <li>
            <Link to={'/contact'}>Contact</Link>
          </li>
          <li>
            <Link to={'/support'}>Support</Link>
          </li>
        </ul>
      </div>
      {props.user &&
        !props.user.auth && (
          <div className="col-sm-2">
            <ul>
              <li>
                <Link to={'/login'}>Log In</Link>
              </li>
              <li>
                <Link to={'/register'}>Register</Link>
              </li>
              <li>
                <Link to={'/reset'}>Forgot Password?</Link>
              </li>
            </ul>
          </div>
        )}
    </div>
    <div className="row mt-5">
      <div className="col">
        <small>
          <p className="text-center">
            &copy; {year !== 2017 && <span>2017&ndash;</span>}
            {year} <a href="https://ochremusic.com">Christopher Leary</a>
          </p>
          <p className="text-center">
            {networkLinks()} | <a href="https://nem.io/">NEM</a>
          </p>
        </small>
        <div className="text-center social">
          <a href="https://twitter.com/ochremusic">
            <FontAwesome name="twitter" className="icon-left" />
          </a>
          <a href="https://github.com/csleary/nemp3v2">
            <FontAwesome name="github" className="icon-left" />
          </a>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
