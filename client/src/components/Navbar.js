import React, { Component } from 'react';
import { Link, NavLink } from 'react-router-dom';
import FontAwesome from 'react-fontawesome';
import classNames from 'classnames';
import throttle from 'lodash.throttle';
import Logo from './Logo';
import '../style/navbar.css';

class Navbar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showLogo: false
    };
  }

  componentDidMount() {
    document.addEventListener('scroll', throttle(this.handleScroll, 100));
  }

  componentWillUnmount() {
    document.removeEventListener('scroll', this.handleScroll);
  }

  handleScroll = () => {
    const navbarPos = document.getElementsByClassName('navbar')[0].offsetTop;
    const scrollPos = window.pageYOffset;

    if (scrollPos < navbarPos) this.setState({ showLogo: false });
    else this.setState({ showLogo: true });
  };

  authStatus() {
    const { user } = this.props;

    if (user.isLoading) return null;

    switch (user.auth) {
      case null:
        return null;
      case undefined:
        return (
          <ul className="navbar-nav ml-auto">
            <li className="nav-item">
              <NavLink to={'/login'} className="nav-link">
                <FontAwesome name="sign-in" className="mr-1" />
                <span className="nav-label">Log In</span>
              </NavLink>
            </li>
          </ul>
        );
      default:
        return (
          <ul className="navbar-nav ml-auto">
            <li className="nav-item">
              <NavLink to={'/release/add/'} className="nav-link">
                <FontAwesome name="plus-square" className="mr-1" />
                <span className="nav-label">Add Release</span>
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to={'/dashboard'} className="nav-link">
                <FontAwesome name="user-circle" className="mr-1" />
                <span className="nav-label">Dashboard</span>
              </NavLink>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="/api/logout">
                <FontAwesome name="sign-out" className="mr-1" />
                <span className="nav-label">Log out</span>
              </a>
            </li>
          </ul>
        );
    }
  }

  render() {
    const className = classNames('navbar-brand-link', {
      show: this.state.showLogo
    });

    return (
      <nav className="navbar sticky-top navbar-expand-lg">
        <Link to={'/'} className={className}>
          <Logo class="navbar-brand" />
        </Link>
        {this.authStatus()}
      </nav>
    );
  }
}

export default Navbar;
