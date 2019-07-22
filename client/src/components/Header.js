import '../style/header.css';
import { Link } from 'react-router-dom';
import MainLogo from './MainLogo';
import React from 'react';

const Header = () => (
  <>
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
  </>
);

export default Header;
