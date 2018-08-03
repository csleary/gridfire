import debounce from 'lodash.debounce';
import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux';
import { Link, NavLink, withRouter } from 'react-router-dom';
import FontAwesome from 'react-fontawesome';
import classNames from 'classnames';
import throttle from 'lodash.throttle';
import {
  fetchCatalogue,
  fetchUser,
  logOut,
  searchReleases,
  toastSuccess
} from '../actions';
import Logo from './Logo';
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
    document.addEventListener('scroll', throttle(this.handleScroll, 100));
  }

  componentWillUnmount() {
    document.removeEventListener('scroll', this.handleScroll);
  }

  handleSearchInput = e => {
    this.setState({ searchQuery: e.target.value }, () => {
      this.handleSearch();
    });
  };

  handleSearchBlur = () => {
    this.setState({ searchQuery: '', expandSearch: false });
  };

  handleSearchFocus = () => {
    this.searchBar.focus();
    this.setState({ expandSearch: true });
  };

  handleClearSearch = () => {
    this.searchBar.focus();
    this.setState({ searchQuery: '' });
    this.handleSearch();
  };

  handleSearch = debounce(
    () => {
      const { searchQuery } = this.state;
      this.props.searchReleases(searchQuery);
    },
    250,
    { leading: false, trailing: true }
  );

  handleSubmit = e => {
    e.preventDefault();
    this.props.history.push('/searchResults');
  };

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

  renderSearchPreview = () => {
    const { searchResults } = this.props;
    const { expandSearch, searchQuery } = this.state;

    const previewClassNames = classNames('search-preview', {
      expanded: expandSearch && searchResults.length
    });
    const clearSearchClassNames = classNames('clear-search-icon', {
      show: searchQuery
    });

    const resultsList = searchResults.map(release => (
      <Link
        className="list-group-item list-group-item-action"
        key={release._id}
        to={`/release/${release._id}`}
      >
        {release.artistName} &bull; {release.releaseTitle}
      </Link>
    ));

    return (
      <Fragment>
        <div className={previewClassNames}>
          <ul className="list-group">{resultsList}</ul>
        </div>
        <FontAwesome
          className="search-icon"
          onClick={this.handleSearchFocus}
          name="search"
        />
        <FontAwesome
          className={clearSearchClassNames}
          onClick={this.handleClearSearch}
          name="times"
        />
      </Fragment>
    );
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

    const searchBarClassNames = classNames('form-control', 'search', {
      expanded: this.state.expandSearch
    });

    return (
      <nav className="navbar sticky-top navbar-expand-lg">
        <Link to={'/'} className={brandClass}>
          <Logo class="navbar-brand" />
        </Link>
        <form className="ml-3" onSubmit={this.handleSubmit}>
          <div className="form-group d-flex align-items-center">
            {this.renderSearchPreview()}
            <input
              className={searchBarClassNames}
              onBlur={this.handleSearchBlur}
              onChange={this.handleSearchInput}
              onFocus={this.handleSearchFocus}
              placeholder={this.state.expandSearch && 'Search…'}
              ref={el => {
                this.searchBar = el;
              }}
              tabIndex="-1"
              type="text"
              value={this.state.searchQuery}
            />
          </div>
        </form>
        <ul className={navbarClass}>{this.renderUserLinks()}</ul>
      </nav>
    );
  }
}

function mapStateToProps(state) {
  return {
    searchResults: state.releases.searchResults,
    user: state.user
  };
}

export default connect(
  mapStateToProps,
  { fetchCatalogue, fetchUser, logOut, searchReleases, toastSuccess }
)(withRouter(Navbar));
