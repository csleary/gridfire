import React, { Component, Fragment } from 'react';
import { Link, NavLink, withRouter } from 'react-router-dom';
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

  handleLogout() {
    this.props.logOut(res => {
      this.props.toastSuccess(res.data.success);
      this.props.fetchUser();
      this.props.history.push('/login');
    });
  }

  handleScroll = () => {
    const navbarPos = document.getElementsByClassName('navbar')[0].offsetTop;
    const scrollPos = window.pageYOffset;

    if (scrollPos < navbarPos) this.setState({ showLogo: false });
    else this.setState({ showLogo: true });
  };

  renderUserLinks() {
    const { user } = this.props;

    if (user.isLoading) return null;

    switch (user.auth) {
      case undefined:
        return (
          <li className="nav-item">
            <NavLink to={'/login'} className="nav-link">
              <FontAwesome name="sign-in" className="mr-1" />
              <span className="nav-label">Log In</span>
            </NavLink>
          </li>
        );
      default:
        return (
          <Fragment>
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
              <a
                className="nav-link"
                tabIndex="-1"
                onClick={() => this.handleLogout()}
                role="button"
                style={{ cursor: 'pointer' }}
              >
                <FontAwesome name="sign-out" className="mr-1" />
                <span className="nav-label">Log out</span>
              </a>
            </li>
          </Fragment>
        );
    }
  }

  render() {
    const navbarClass = classNames('navbar-nav', 'ml-auto', {
      loaded: !this.props.user.isLoading
    });

    const brandClass = classNames('navbar-brand-link', {
      show: this.state.showLogo
    });

    return (
      <nav className="navbar sticky-top navbar-expand-lg">
        <Link to={'/'} className={brandClass}>
          <Logo class="navbar-brand" />
        </Link>
        <ul className={navbarClass}>{this.renderUserLinks()}</ul>
      </nav>
    );
  }
}

export default withRouter(Navbar);
