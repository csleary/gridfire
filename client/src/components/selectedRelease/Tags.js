import PropTypes from 'prop-types';
import React from 'react';
import styles from 'style/SelectedRelease.module.css';
import uuidv4 from 'uuid/v4';
import { withRouter } from 'react-router-dom';

const Tags = props => {
  const { tags } = props;

  if (!tags.length) return null;

  const handleTagSearch = tag => {
    props.searchReleases(tag).then(props.history.push('/search'));
  };

  const renderTags = tags.map(tag => (
    <div
      className={`${styles.tag} mr-2 mb-2`}
      key={uuidv4()}
      onClick={() => handleTagSearch(tag)}
      role="button"
      tabIndex="-1"
      title={`Click to see more releases tagged with '${tag}'.`}
    >
      {tag}
    </div>
  ));

  return (
    <>
      <h6 className="red mt-4 mb-3">Tags</h6>
      <div className={styles.tags}>{renderTags}</div>
    </>
  );
};

Tags.propTypes = {
  history: PropTypes.object,
  searchReleases: PropTypes.func,
  tags: PropTypes.array
};

export default withRouter(Tags);
