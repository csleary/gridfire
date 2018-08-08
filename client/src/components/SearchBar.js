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

  handleSearchBlur = () =>
    this.setState({ searchQuery: '', expandSearch: false });

  handleSearchFocus = () => {
    this.searchBar.focus();
    this.setState({ expandSearch: true });
  };

  handlePreviewClick = () => {
    this.setState({ expandSearch: true });
  };

  handlePreviewBlur = () => {
    this.setState({ searchQuery: '', expandSearch: false });
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
    this.props.history.push('/search');
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
          <div
            className={previewClassNames}
            onBlur={this.handlePreviewBlur}
            onClick={this.handlePreviewClick}
            onMouseDown={e => e.preventDefault()}
            onMouseUp={this.handlePreviewClick}
            role="button"
            tabIndex="-1"
          >
            <ul className="list-group">
              {searchResults.length && (
                <p className="m-3">
                  <small>
                    {searchResults.length} result{searchResults.length === 1
                      ? ''
                      : 's'}{' '}
                    for &lsquo;{searchQuery}&rsquo;: (Hit return for the{' '}
                    <Link to={'/search'}>full grid view</Link>.)
                  </small>
                </p>
              )}
              {resultsList}
            </ul>
          </div>
          <FontAwesome
            className="search-icon"
            onClick={this.handleSearchFocus}
            onMouseDown={e => e.preventDefault()}
            onMouseUp={this.handleSearchFocus}
            onTouchStart={this.handleSearchFocus}
            name="search"
          />
          <FontAwesome
            className={clearSearchClassNames}
            onClick={this.handleClearSearch}
            onMouseDown={e => e.preventDefault()}
            onMouseUp={this.handleClearSearch}
            name={this.props.isSearching ? 'circle-o-notch' : 'times'}
            spin={this.props.isSearching}
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
    isSearching: state.releases.isSearching,
    searchResults: state.releases.searchResults
  };
}

export default connect(
  mapStateToProps,
  { searchReleases }
)(withRouter(Navbar));
