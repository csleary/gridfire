import classNames from 'classnames';
import throttle from 'lodash.throttle';
import React, { Component, Fragment } from 'react';
import FontAwesome from 'react-fontawesome';
import { connect } from 'react-redux';
import { Link, NavLink, withRouter } from 'react-router-dom';
import { fetchCatalogue, fetchUser, logOut, toastSuccess } from '../actions';
import Logo from './Logo';
import SearchBar from './SearchBar';
import '../style/navbar.css';

class Navbar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      searchQuery: '',
      showLogo: false,
      expandSearch: false
    };
  }

  componentDidMount() {
    document.addEventListener('scroll', throttle(this.handleScroll, 200));
  }

  componentWillUnmount() {
    document.removeEventListener('scroll', this.handleScroll);
  }

  handleLogout = () => {
    this.props.logOut(res => {
      this.props.toastSuccess(res.data.success);
      this.props.fetchUser();
      this.props.history.push('/login');
    });
  };

  handleScroll = () => {
    const navbarPos = document.getElementsByClassName('navbar')[0].offsetTop;
    const scrollPos = window.pageYOffset;

    if (scrollPos < navbarPos) {
      this.setState({ showLogo: false });
    } else {
      this.setState({ showLogo: true });
    }
  };

  renderUserLinks() {
    const {
      user: { auth, credit, isLoading }
    } = this.props;

    if (isLoading) return null;

    if (!auth) {
      return (
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
      );
    }

    const creditClass = classNames('credit', {
      cyan: credit > 1,
      yellow: credit === 1,
      red: credit === 0
    });

    return (
      <Fragment>
        <li className="nav-item">
          <NavLink
            to={'/release/add/'}
            className="nav-link"
            title="Add a new release."
          >
            <FontAwesome name="plus-square" className="mr-1" />
            <span className="nav-label">Add Release</span>
            <span
              className={creditClass}
              title={`Your nemp3 credit balance is: ${credit}`}
            >
              {' '}
              ({credit})
            </span>
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
        </li>
        <li className="nav-item">
          <a
            className="nav-link"
            tabIndex="-1"
            onClick={this.handleLogout}
            role="button"
            style={{ cursor: 'pointer' }}
          >
            <FontAwesome
              name="sign-out"
              className="mr-1"
              title="Log out of your account."
            />
            <span className="nav-label">Log out</span>
          </a>
        </li>
      </Fragment>
    );
  }

  render() {
    const navbarClass = classNames('navbar-nav', 'ml-auto', {
      loaded: !this.props.user.isLoading
    });

    const brandClass = classNames('navbar-brand-link', 'ml-3', {
      show: this.state.showLogo
    });

    return (
      <nav className="navbar sticky-top navbar-expand-lg">
        <SearchBar />
        <Link
          to={'/'}
          className={brandClass}
          title="Search all available releases."
        >
          <Logo class="navbar-brand" />
        </Link>
        <ul className={navbarClass}>{this.renderUserLinks()}</ul>
      </nav>
    );
  }
}

function mapStateToProps(state) {
  return {
    user: state.user
  };
}

export default connect(
  mapStateToProps,
  { fetchCatalogue, fetchUser, logOut, toastSuccess }
)(withRouter(Navbar));
