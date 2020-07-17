import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import React from 'react';
import { nanoid } from '@reduxjs/toolkit';
import { searchReleases } from 'features/search';
import styles from 'components/activeRelease/activeRelease.module.css';
import { useHistory } from 'react-router-dom';

const Tags = () => {
  const dispatch = useDispatch();
  const history = useHistory();
  const { tags } = useSelector(state => state.releases.activeRelease, shallowEqual);
  if (!tags.length) return null;
  const handleTagSearch = tag => dispatch(searchReleases(tag)).then(history.push('/search'));

  const renderTags = tags.map(tag => (
    <div
      className={`${styles.tag} mr-2 mb-2`}
      key={nanoid()}
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
      <h6 className="yellow mt-4 mb-3">Tags</h6>
      <div className={styles.tags}>{renderTags}</div>
    </>
  );
};

export default Tags;
