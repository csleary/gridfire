import React, { useRef, useState } from 'react';
import { animated, useTransition } from 'react-spring';
import Button from 'components/button';
import FontAwesome from 'react-fontawesome';
import PropTypes from 'prop-types';
import styles from './sortReleases.module.css';
import { useOnClickOutside } from 'hooks/useOnClickOutside';

const sortOptions = [
  { title: 'Date Added', sortPath: 'dateCreated', '1': 'Old', '-1': 'New' },
  {
    title: 'Release Date',
    sortPath: 'releaseDate',
    '1': 'Old',
    '-1': 'New'
  },
  {
    title: 'Artist Name',
    sortPath: 'artistName',
    '1': 'A\u2013Z',
    '-1': 'Z\u2013A'
  },
  {
    title: 'Release Title',
    sortPath: 'releaseTitle',
    '1': 'A\u2013Z',
    '-1': 'Z\u2013A'
  },
  { title: 'Price', sortPath: 'price', '-1': 'Desc.', '1': 'Asc.' }
];

const SortReleases = ({ handleFetchCatalogue, sortPath, setSortPath, sortOrder, setSortOrder }) => {
  const sortRef = useRef();
  const [showSortMenu, setShowSortMenu] = useState(false);

  const transitions = useTransition(showSortMenu, null, {
    config: { mass: 1, tension: 250, friction: 10, clamp: true, easing: 'cubic-bezier(0.2, 0.8, 0.4, 1)' },
    from: { opacity: 0, transform: 'scale(0.98) translateY(-0.25rem)' },
    enter: { opacity: 1, transform: 'scale(1) translateY(0)' },
    leave: { opacity: 0, transform: 'scale(0.98) translateY(-0.25rem)' }
  });

  useOnClickOutside(sortRef, () => setShowSortMenu(false));
  const [isSorting, setSorting] = useState(false);

  const handleSortPath = async path => {
    setSorting(true);
    setShowSortMenu(false);
    await handleFetchCatalogue(path, sortOrder);
    setSortPath(path);
    setSorting(false);
  };

  const handleSortOrder = async order => {
    setSorting(true);
    await handleFetchCatalogue(sortPath, order);
    setSortOrder(order);
    setSorting(false);
  };

  return (
    <div className={styles.sort} ref={sortRef}>
      <div className={styles.buttons}>
        <Button
          className={styles.sortButton}
          disabled={isSorting}
          icon="sort"
          iconClassName={styles.sortIcon}
          onClick={() => setShowSortMenu(!showSortMenu)}
          textLink
        >
          {sortOptions.find(option => option.sortPath === sortPath).title}
        </Button>
        <Button
          className={styles.sortButton}
          disabled={isSorting}
          onClick={() => handleSortOrder(sortOrder * -1)}
          textLink
        >
          {`(${sortOptions.find(option => option.sortPath === sortPath)[sortOrder.toString()]})`}
        </Button>
        {isSorting ? <FontAwesome name="cog" spin /> : null}
      </div>
      {transitions.map(
        ({ item, props: animations, key }) =>
          item && (
            <animated.ul className={styles.sortList} key={key} style={animations}>
              {sortOptions.map(option => (
                <li className={styles.sortItem} key={option.title} onClick={() => handleSortPath(option.sortPath)}>
                  {option.title}
                </li>
              ))}
            </animated.ul>
          )
      )}
    </div>
  );
};

SortReleases.propTypes = {
  handleFetchCatalogue: PropTypes.func,
  sortPath: PropTypes.string,
  setSortPath: PropTypes.func,
  sortOrder: PropTypes.number,
  setSortOrder: PropTypes.func
};

export default SortReleases;
