import { animated, config, useTrail } from 'react-spring';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import React from 'react';
import { nanoid } from '@reduxjs/toolkit';
import { searchReleases } from 'features/search';
import styles from './tags.module.css';
import { useHistory } from 'react-router-dom';

const Tags = ({ trailRef }) => {
  const dispatch = useDispatch();
  const history = useHistory();
  const { tags } = useSelector(state => state.releases.activeRelease, shallowEqual);

  const trail = useTrail(tags.length, {
    config: { ...config.stiff, clamp: true },
    from: { opacity: 0 },
    to: { opacity: 1 },
    ref: trailRef
  });

  if (!tags.length) return null;
  const handleTagSearch = tag => dispatch(searchReleases(tag)).then(history.push('/search'));

  return (
    <>
      <h6 className={styles.title}>Tags</h6>
      <div className={styles.tags}>
        {trail.map((style, index) => {
          const tag = tags[index];

          return (
            <animated.div
              className={styles.tag}
              key={nanoid()}
              onClick={() => handleTagSearch(tag)}
              role="button"
              tabIndex="-1"
              title={`Click to see more releases tagged with '${tag}'.`}
              style={style}
            >
              {tag}
            </animated.div>
          );
        })}
      </div>
    </>
  );
};

export default Tags;
