import { Link, withRouter } from 'react-router-dom';
import React, { Component } from 'react';
import FontAwesome from 'react-fontawesome';
import classNames from 'classnames';
import { connect } from 'react-redux';
import debounce from 'lodash.debounce';
import { searchReleases } from '../actions';
import styles from '../style/SearchBar.module.css';

class SearchBar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      searchQuery: '',
      showLogo: false,
      expandSearch: false
    };
  }

  handleKeyDown = e => {
    if (e.keyCode === 27) {
      this.searchBar.blur();
      this.setState({ expandSearch: false });
    }
  };

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

    const previewClassNames = classNames(styles.preview, {
      [styles.showPreview]: expandSearch && searchResults.length
    });
    const clearSearchClassNames = classNames(styles.clear, {
      [styles.showClear]: searchQuery
    });
    const searchBarClassNames = classNames(styles.search, {
      [styles.expanded]: this.state.expandSearch
    });

    const resultsList = searchResults.map(release => (
      <Link
        className={`${styles.item} ${styles.action}`}
        key={release._id}
        to={`/release/${release._id}`}
      >
        {release.artistName} &bull; {release.releaseTitle}
      </Link>
    ));

    return (
      <form className={styles.form} onSubmit={this.handleSubmit}>
        <div className={styles.formGroup}>
          <div
            className={previewClassNames}
            onBlur={this.handlePreviewBlur}
            onClick={this.handlePreviewClick}
            onMouseDown={e => e.preventDefault()}
            onMouseUp={this.handlePreviewClick}
            role="button"
            tabIndex="-1"
          >
            <ul className={styles.list}>
              {searchResults.length && (
                <p className={styles.p}>
                  <small>
                    {searchResults.length} result
                    {searchResults.length === 1 ? '' : 's'} for &lsquo;
                    {searchQuery}&rsquo; (hit return for the{' '}
                    <Link to={'/search'}>full grid view</Link>):
                  </small>
                </p>
              )}
              {resultsList}
            </ul>
          </div>
          <FontAwesome
            className={styles.icon}
            onClick={this.handleSearchFocus}
            onMouseDown={e => e.preventDefault()}
            onMouseUp={this.handleSearchFocus}
            onTouchStart={this.handleSearchFocus}
            name="search"
            title="Search all available releases."
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
            onKeyDown={this.handleKeyDown}
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
)(withRouter(SearchBar));
