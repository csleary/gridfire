import React, { useRef, useState } from 'react';
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

const SortReleases = ({
  handleFetchCatalogue,
  sortPath,
  setSortPath,
  sortOrder,
  setSortOrder
}) => {
  const sortRef = useRef();
  const [showSortMenu, setShowSortMenu] = useState(false);
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

  const renderSortMenu = () => {
    if (!showSortMenu) return null;

    return sortOptions.map(option => (
      <li
        className={styles.sortItem}
        key={option.title}
        onClick={() => handleSortPath(option.sortPath)}
      >
        {option.title}
      </li>
    ));
  };

  return (
    <div className={styles.sort} ref={sortRef}>
      <div className={styles.buttons}>
        <button
          className={`btn btn-outline-primary btn-sm ${styles.sortButton}`}
          disabled={isSorting}
          onClick={() => setShowSortMenu(!showSortMenu)}
        >
          <FontAwesome name="sort" className="mr-2" />
          {sortOptions.find(option => option.sortPath === sortPath).title}
        </button>
        <button
          className={`btn btn-outline-primary btn-sm ${styles.sortButton}`}
          disabled={isSorting}
          onClick={() => handleSortOrder(sortOrder * -1)}
        >
          {`(${
            sortOptions.find(option => option.sortPath === sortPath)[
              sortOrder.toString()
            ]
          })`}
        </button>
        {isSorting ? (
          <FontAwesome className="yellow ml-2" name="cog" spin />
        ) : null}
      </div>
      <ul className={styles.sortList}>{renderSortMenu()}</ul>
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
