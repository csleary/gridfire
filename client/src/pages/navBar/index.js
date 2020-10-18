import './navbar.css';
import { Link, NavLink, useHistory } from 'react-router-dom';
import React, { useEffect, useRef, useState } from 'react';
import { batch, shallowEqual, useDispatch, useSelector } from 'react-redux';
import { fetchUser, logOut } from 'features/user';
import Button from 'components/button';
import DashNav from './dashNav';
import Dropdown from 'components/dropdown';
import FontAwesome from 'react-fontawesome';
import Logo from './logo';
import SearchBar from './searchBar';
import classnames from 'classnames';
import styles from './navBar.module.css';
import throttle from 'lodash.throttle';
import { toastSuccess } from 'features/toast';

const NavBar = () => {
  const dispatch = useDispatch();
  const history = useHistory();
  const navBar = useRef();
  const [showLogo, setShowLogo] = useState(false);
  const [menuIsOpen, setMenuIsOpen] = useState(false);
  const { user } = useSelector(state => state, shallowEqual);
  const { auth, credits, isLoading } = user;

  useEffect(() => {
    document.addEventListener('scroll', throttle(handleScroll, 200));
    return () => document.removeEventListener('scroll', handleScroll);
  });

  const handleLogout = () => {
    dispatch(
      logOut(res => {
        history.push('/login');
        batch(() => {
          dispatch(fetchUser());
          dispatch(toastSuccess(res.data.success));
        });
      })
    );
  };

  const handleScroll = () => {
    const navbarPos = navBar.current?.offsetTop;
    const scrollPos = window.pageYOffset;
    if (scrollPos < navbarPos) return setShowLogo(false);
    return setShowLogo(true);
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
                  <FontAwesome name="sign-in" className={styles.icon} title="Click to log in." />
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
                  <FontAwesome name="plus-square" className={styles.icon} />
                  <span className={styles.label}>Add Release</span>
                  <FontAwesome
                    name="certificate"
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
                  icon={auth.oauthService ?? 'user-circle'}
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
                  icon="sign-out"
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
