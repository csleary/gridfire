import React from 'react';
import FontAwesome from 'react-fontawesome';
import '../style/footer.css';

const today = new Date();
const year = today.getFullYear();

const Footer = () => (
  <footer>
    {(process.env.NODE_ENV !== 'production' ||
      process.env.REACT_APP_NEM_NETWORK === 'testnet') && (
        <p className="text-center">Currently running on the NEM testnet.</p>
      )}
    <small>
      <p className="text-center">
        &copy; {year !== 2017 && <span>2017&ndash;</span>}
        {year}
        <a href="http://ochremusic.com"> Christopher Leary</a>
      </p>
    </small>
    <p className="text-center github">
      <a href="https://github.com/csleary/nemp3v2">
        <FontAwesome name="github" className="icon-left" />
      </a>
    </p>
  </footer>
);

export default Footer;
