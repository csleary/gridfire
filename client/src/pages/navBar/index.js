import './navbar.css';
import { Link, NavLink, useHistory } from 'react-router-dom';
import React, { useEffect, useRef, useState } from 'react';
import { batch, shallowEqual, useDispatch, useSelector } from 'react-redux';
import { fetchUser, logOut } from 'features/user';
import DashNavBar from './dashNavBar';
import FontAwesome from 'react-fontawesome';
import Logo from './logo';
import SearchBar from './searchBar';
import classNames from 'classnames';
import throttle from 'lodash.throttle';
import { toastSuccess } from 'features/toast';

const NavBar = () => {
  const dispatch = useDispatch();
  const history = useHistory();
  const navBar = useRef();
  const [showLogo, setShowLogo] = useState(false);
  const user = useSelector(state => state.user, shallowEqual);
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
    const navbarPos = navBar.current && navBar.current.offsetTop;
    const scrollPos = window.pageYOffset;
    if (scrollPos < navbarPos) return setShowLogo(false);
    return setShowLogo(true);
  };

  const navbarClass = classNames('navbar-nav', {
    loaded: !isLoading
  });

  const brandClass = classNames('nav-link', {
    hide: !showLogo,
    show: showLogo
  });

  const creditClass = classNames('ml-2', 'credit', {
    cyan: credits > 1,
    yellow: credits === 1,
    red: credits === 0
  });

  const renderNav = () => {
    if (auth === undefined) {
      return (
        <>
          <li className="nav-item mr-auto">
            <Link to={'/'} className={brandClass}>
              <Logo class="navbar-brand" />
            </Link>
          </li>
          <li className="nav-item">
            <NavLink to={'/login'} className="nav-link">
              <FontAwesome name="sign-in" className="mr-2" title="Click to log in." />
              <span className="nav-label">Log In</span>
            </NavLink>
          </li>
        </>
      );
    }

    return (
      <>
        <li className="nav-item ml-auto">
          <Link to={'/'} className={brandClass}>
            <Logo class="navbar-brand" />
          </Link>
        </li>
        <li className="nav-item">
          <NavLink to={'/release/add/'} className="nav-link" title="Add a new release.">
            <FontAwesome name="plus-square" className="mr-2" />
            <span className="nav-label">Add Release</span>
            <FontAwesome
              name="certificate"
              className={creditClass}
              title={`Your nemp3 credit balance is: ${credits}`}
            />{' '}
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink to={'/dashboard'} className="nav-link" title="Visit your dashboard.">
            <FontAwesome name={auth.oauthService ?? 'user-circle'} className="mr-2" />
            <span className="nav-label">Dashboard</span>
          </NavLink>
          <DashNavBar />
        </li>
        <li className="nav-item">
          <button className="nav-link" onClick={handleLogout}>
            <FontAwesome name="sign-out" className="mr-2" title="Log out of your account." />
            <span className="nav-label">Log out</span>
          </button>
        </li>
      </>
    );
  };

  if (isLoading) return null;

  return (
    <nav className="navbar navbar-expand-lg sticky-top" ref={navBar}>
      <ul className={navbarClass}>
        <SearchBar />
        <div className="nav-button-group">{renderNav()}</div>
      </ul>
    </nav>
  );
};

export default NavBar;
