import React from 'react';
import '../style/footer.css';

const today = new Date();
const year = today.getFullYear();

const Footer = () => (
  <footer>
    <small>
      <p className="text-center">
        &copy; {year !== 2017 && <span>2017&ndash;</span>}
        {year}
        <a href="http://ochremusic.com"> Christopher Leary</a>
      </p>
    </small>
  </footer>
);

export default Footer;
