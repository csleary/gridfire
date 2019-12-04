import './navbar.css';
import { Link, NavLink, withRouter } from 'react-router-dom';
import React, { useEffect, useRef, useState } from 'react';
import { connect, useSelector } from 'react-redux';
import { fetchCatalogue, fetchUser, logOut, toastSuccess } from 'actions';
import DashNavBar from './dashNavBar';
import FontAwesome from 'react-fontawesome';
import Logo from './logo';
import PropTypes from 'prop-types';
import SearchBar from './searchBar';
import classNames from 'classnames';
import throttle from 'lodash.throttle';

const NavBar = props => {
  const [showLogo, setShowLogo] = useState(false);
  const navBar = useRef();
  const user = useSelector(state => state.user);
  const { auth, credit, isLoading } = user;

  useEffect(() => {
    document.addEventListener('scroll', throttle(handleScroll, 200));

    return () => {
      document.removeEventListener('scroll', handleScroll);
    };
  });

  const handleLogout = () => {
    props.logOut(res => {
      props.history.push('/login');
      props.fetchUser();
      props.toastSuccess(res.data.success);
    });
  };

  const handleScroll = () => {
    const navbarPos = navBar.current && navBar.current.offsetTop;
    const scrollPos = window.pageYOffset;

    if (scrollPos < navbarPos) {
      setShowLogo(false);
    } else {
      setShowLogo(true);
    }
  };

  const navbarClass = classNames('navbar-nav', {
    loaded: !isLoading
  });

  const brandClass = classNames('nav-link', {
    hide: !showLogo,
    show: showLogo
  });

  const creditClass = classNames('ml-1', 'credit', {
    cyan: credit > 1,
    yellow: credit === 1,
    red: credit === 0
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
              <FontAwesome
                name="sign-in"
                className="mr-1"
                title="Click to log in."
              />
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
          <NavLink
            to={'/release/add/'}
            className="nav-link"
            title="Add a new release."
          >
            <FontAwesome name="plus-square" className="mr-1" />
            <span className="nav-label">Add Release</span>
            <FontAwesome
              name="certificate"
              className={creditClass}
              title={`Your nemp3 credit balance is: ${credit}`}
            />{' '}
          </NavLink>
        </li>
        <li className="nav-item">
          <NavLink
            to={'/dashboard'}
            className="nav-link"
            title="Visit your dashboard."
          >
            <FontAwesome name="user-circle" className="mr-1" />
            <span className="nav-label">Dashboard</span>
          </NavLink>
          <DashNavBar />
        </li>
        <li className="nav-item">
          <button className="nav-link" onClick={handleLogout}>
            <FontAwesome
              name="sign-out"
              className="mr-1"
              title="Log out of your account."
            />
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

NavBar.propTypes = {
  fetchUser: PropTypes.func,
  history: PropTypes.object,
  toastSuccess: PropTypes.func,
  logOut: PropTypes.func,
  user: PropTypes.object
};

export default withRouter(
  connect(null, {
    fetchCatalogue,
    fetchUser,
    logOut,
    toastSuccess
  })(NavBar)
);
