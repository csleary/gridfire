import debounce from 'lodash.debounce';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link, withRouter } from 'react-router-dom';
import FontAwesome from 'react-fontawesome';
import classNames from 'classnames';
import { searchReleases } from '../actions';
import '../style/searchBar.css';

class Navbar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      searchQuery: '',
      showLogo: false,
      expandSearch: false
    };
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

  render() {
    const { searchResults } = this.props;
    const { expandSearch, searchQuery } = this.state;

    const previewClassNames = classNames('search-preview', {
      expanded: expandSearch && searchResults.length
    });
    const clearSearchClassNames = classNames('clear-search-icon', {
      show: searchQuery
    });
    const searchBarClassNames = classNames('form-control', 'search', {
      expanded: this.state.expandSearch
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
      <form className="ml-3" onSubmit={this.handleSubmit}>
        <div className="form-group d-flex align-items-center">
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
          <input
            className={searchBarClassNames}
            onBlur={this.handleSearchBlur}
            onChange={this.handleSearchInput}
            onFocus={this.handleSearchFocus}
            placeholder={this.state.expandSearch ? 'Search…' : undefined}
            ref={el => {
              this.searchBar = el;
            }}
            tabIndex="-1"
            type="text"
            value={this.state.searchQuery}
          />
        </div>
      </form>
    );
  }
}

function mapStateToProps(state) {
  return {
    searchResults: state.releases.searchResults
  };
}

export default connect(
  mapStateToProps,
  { searchReleases }
)(withRouter(Navbar));
