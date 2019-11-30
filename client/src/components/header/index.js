import { Link } from 'react-router-dom';
import MainLogo from './mainLogo';
import React from 'react';
import styles from './header.module.css';

const Header = () => (
  <>
    <div className={styles.gradient} />
    <header className={`${styles.header} container-fluid`}>
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
