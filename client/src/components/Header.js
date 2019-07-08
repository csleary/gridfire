import React from 'react';
import { Link } from 'react-router-dom';
import MainLogo from './MainLogo';
import '../style/header.css';

const Header = () => (
  <div>
    <div className="gradient" />
    <header className="header container-fluid">
      <div className="row">
        <div className="col">
          <Link to="/">
            <MainLogo />
          </Link>
        </div>
      </div>
    </header>
  </div>
);

export default Header;
