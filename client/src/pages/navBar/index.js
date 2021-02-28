import { Link, NavLink } from 'react-router-dom';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { faCertificate, faPlus, faSignInAlt, faSignOutAlt, faUserCircle } from '@fortawesome/free-solid-svg-icons';
import { faGoogle, faSpotify, faTwitter } from '@fortawesome/free-brands-svg-icons';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import Button from 'components/button';
import DashNav from './dashNav';
import Dropdown from 'components/dropdown';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Logo from './logo';
import SearchBar from './searchBar';
import classnames from 'classnames';
import { logOut } from 'features/user';
import styles from './navBar.module.css';
import throttle from 'lodash.throttle';

const NavBar = () => {
  const dispatch = useDispatch();
  const navBar = useRef();
  const [showLogo, setShowLogo] = useState(false);
  const [menuIsOpen, setMenuIsOpen] = useState(false);
  const { user } = useSelector(state => state, shallowEqual);
  const { auth, credits, isLoading } = user;

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
    dispatch(logOut());
  };

  const logoClassNames = classnames(styles.logoLink, {
    [styles.show]: showLogo
  });

  const creditClass = classnames(styles.credit, {
    cyan: credits > 1,
    yellow: credits === 1,
    red: !credits
  });

  if (isLoading) return null;

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
              <li>
                <NavLink to={'/release/add/'} className={styles.link} title="Add a new release.">
                  <FontAwesomeIcon icon={faPlus} className={styles.icon} />
                  <span className={styles.label}>Add Release</span>
                  <FontAwesomeIcon
                    icon={faCertificate}
                    className={creditClass}
                    title={`Your nemp3 credit balance is: ${credits}`}
                  />
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
