import React from 'react';
import { Link } from 'react-router-dom';
import FontAwesome from 'react-fontawesome';
import '../style/footer.css';

const today = new Date();
const year = today.getFullYear();

const Footer = props => (
  <footer className="container-fluid">
    <div className="row justify-content-center">
      <div className="col col-sm-2">
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
          {/* <li>
            <Link to={'/donate'}>Donate</Link>
          </li> */}
          <li>
            <a href="https://nem.io/" title="Visit the official NEM site.">
              NEM
              <FontAwesome name="external-link" className="ml-1" />
            </a>
          </li>
        </ul>
      </div>
      {props.user &&
        !props.user.auth && (
          <div className="col col-sm-2">
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
      {props.user &&
        props.user.auth && (
          <div className="col col-sm-2">
            <ul>
              <li>
                <Link to={'/release/add/'}>Add Release</Link>
              </li>
              <li>
                <Link to={'/dashboard'}>Dashboard</Link>
              </li>
              <li>
                <Link to={'/dashboard/collection'}>Collection</Link>
              </li>
              <li>
                <Link to={'/dashboard/nem-address'}>Your NEM Address</Link>
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
        </small>
        <div className="text-center social">
          <a href="https://twitter.com/ochremusic">
            <FontAwesome name="twitter" className="mr-2" />
          </a>
          <a href="https://github.com/csleary/nemp3v2">
            <FontAwesome name="github" className="mr-2" />
          </a>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
