import { Link, NavLink } from 'react-router-dom';
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { faEthereum, faGoogle, faSpotify, faTwitter } from '@fortawesome/free-brands-svg-icons';
import { faPlus, faSignInAlt, faSignOutAlt, faUserCircle } from '@fortawesome/free-solid-svg-icons';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import Button from 'components/button';
import DashNav from './dashNav';
import Dropdown from 'components/dropdown';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Logo from './logo';
import SearchBar from './searchBar';
import { Web3Context } from 'index';
import classnames from 'classnames';
import { logOut } from 'features/user';
import { setAccount } from 'features/web3';
import styles from './navBar.module.css';
import throttle from 'lodash.throttle';
import { useNavigate } from 'react-router-dom';

const NavBar = () => {
  const provider = useContext(Web3Context);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const navBar = useRef();
  const [showLogo, setShowLogo] = useState(false);
  const [menuIsOpen, setMenuIsOpen] = useState(false);
  const { user, web3 } = useSelector(state => state, shallowEqual);
  const { auth, isLoading } = user;
  const { account = '', isConnected } = web3 || {};
  const shortAccount = account ? `${account.slice(0, 6)}…${account.slice(-4)}` : '';

  const handleScroll = useCallback(
    throttle(() => {
      const navbarPos = navBar.current?.offsetTop;
      const scrollPos = window.pageYOffset;
      if (scrollPos < navbarPos) return setShowLogo(false);
      setShowLogo(true);
    }, 500),
    []
  );

  useEffect(() => {
    document.addEventListener('scroll', handleScroll);
    return () => document.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const handleLogout = () => {
    dispatch(logOut()).then(() => navigate('/'));
  };

  const logoClassNames = classnames(styles.logoLink, {
    [styles.show]: showLogo
  });

  if (isLoading) return null;

  const handleConnect = async () => {
    const accounts = await provider.send('eth_requestAccounts', []);
    const [firstAccount] = accounts || [];
    dispatch(setAccount(firstAccount));
  };

  return (
    <nav className={styles.root} ref={navBar}>
      <ul className={styles.list}>
        <SearchBar />
        <div className={styles.group}>
          {auth === undefined ? (
            <>
              <li className="mr-auto">
                <Link to={'/'} className={logoClassNames}>
                  <Logo class={styles.logo} />
                </Link>
              </li>
              <li>
                <NavLink to={'/login'} className={styles.link}>
                  <FontAwesomeIcon icon={faSignInAlt} className={styles.icon} title="Click to log in." />
                  <span className={styles.label}>Log In</span>
                </NavLink>
              </li>
            </>
          ) : (
            <>
              <li className="ml-auto">
                <Link to={'/'} className={logoClassNames}>
                  <Logo class={styles.logo} />
                </Link>
              </li>
              {isConnected ? (
                <li>
                  <span className={styles.info} title={account}>
                    <FontAwesomeIcon icon={faEthereum} className="mr-2" />
                    {shortAccount}
                  </span>
                </li>
              ) : (
                <li>
                  <Button className={styles.link} iconClassName={styles.icon} onClick={handleConnect} textLink>
                    <FontAwesomeIcon
                      icon={faEthereum}
                      className={styles.icon}
                      title="Connect to your Ethereum account."
                    />
                    <span className={styles.label} title="Connect to your Ethereum account.">
                      Connect
                    </span>
                  </Button>
                </li>
              )}
              <li>
                <NavLink to={'/release/add/'} className={styles.link} title="Add a new release.">
                  <FontAwesomeIcon icon={faPlus} className={styles.icon} />
                  <span className={styles.label}>Add Release</span>
                </NavLink>
              </li>
              <li>
                <Dropdown
                  className={classnames(styles.link, { [styles.active]: menuIsOpen })}
                  closeOnClick
                  dropdownClassName={styles.dropdown}
                  fullWidth
                  icon={
                    auth.oauthService === 'google'
                      ? faGoogle
                      : auth.oauthService === 'spotify'
                      ? faSpotify
                      : auth.oauthService === 'twitter'
                      ? faTwitter
                      : faUserCircle
                  }
                  iconClassName={styles.icon}
                  offset={0}
                  onClick={() => setMenuIsOpen(!menuIsOpen)}
                  onClickOutside={() => setMenuIsOpen(false)}
                  text="Dashboard"
                  textLink
                  title="Visit your dashboard."
                >
                  <DashNav />
                </Dropdown>
              </li>
              <li>
                <Button
                  className={styles.link}
                  icon={faSignOutAlt}
                  iconClassName={styles.icon}
                  onClick={handleLogout}
                  textLink
                >
                  <span className={styles.label} title="Log out of your account.">
                    Log out
                  </span>
                </Button>
              </li>
            </>
          )}
        </div>
      </ul>
    </nav>
  );
};

export default NavBar;
