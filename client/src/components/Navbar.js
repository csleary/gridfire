import React, { Component } from 'react';
import { Link, NavLink } from 'react-router-dom';
import FontAwesome from 'react-fontawesome';
import classNames from 'classnames';
import Logo from './Logo';
import '../style/navbar.css';

class Navbar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      showLogo: false
    };
    this.handleScroll = this.handleScroll.bind(this);
  }

  componentDidMount() {
    window.addEventListener('scroll', this.handleScroll);
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.handleScroll);
  }

  handleScroll() {
    const headerHeight = document.getElementById('header').offsetHeight + 4;
    const y = window.scrollY;

    if (y > headerHeight) {
      this.setState({ showLogo: true });
    } else {
      this.setState({ showLogo: false });
    }
  }

  authStatus() {
    if (this.props.user.isLoading) {
      return null;
    }

    switch (this.props.user.auth) {
      case null:
        return null;
      case undefined:
        return (
          <ul className="navbar-nav ml-auto">
            <li className="nav-item">
              <NavLink to={'/login'} className="nav-link">
                <FontAwesome name="sign-in" className="icon-left" />
                <span className="nav-label">Login</span>
              </NavLink>
            </li>
          </ul>
        );
      default:
        return (
          <ul className="navbar-nav ml-auto">
            <li className="nav-item">
              <NavLink to={'/release/add/'} className="nav-link">
                <FontAwesome name="plus-square" className="icon-left" />
                <span className="nav-label">Add Release</span>
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to={'/dashboard'} className="nav-link">
                <FontAwesome name="user-circle" className="icon-left" />
                <span className="nav-label">Dashboard</span>
              </NavLink>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="/api/logout">
                <FontAwesome name="sign-out" className="icon-left" />
                <span className="nav-label">Log out</span>
              </a>
            </li>
          </ul>
        );
    }
  }

  render() {
    const className = classNames('navbar-brand-link', {
      'navbar-brand-show': this.state.showLogo
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
