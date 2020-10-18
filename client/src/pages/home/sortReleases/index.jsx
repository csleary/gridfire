import React, { useRef, useState } from 'react';
import Button from 'components/button';
import Dropdown from 'components/dropdown';
import FontAwesome from 'react-fontawesome';
import PropTypes from 'prop-types';
import styles from './sortReleases.module.css';

const sortOptions = [
  { title: 'Date Added', sortPath: 'dateCreated', 1: 'Old', '-1': 'New' },
  {
    title: 'Release Date',
    sortPath: 'releaseDate',
    1: 'Old',
    '-1': 'New'
  },
  {
    title: 'Artist Name',
    sortPath: 'artistName',
    1: 'A\u2013Z',
    '-1': 'Z\u2013A'
  },
  {
    title: 'Release Title',
    sortPath: 'releaseTitle',
    1: 'A\u2013Z',
    '-1': 'Z\u2013A'
  },
  { title: 'Price', sortPath: 'price', '-1': 'Desc.', 1: 'Asc.' }
];

const SortReleases = ({ handleFetchCatalogue, sortPath, setSortPath, sortOrder, setSortOrder }) => {
  const sortRef = useRef();
  const [isSorting, setSorting] = useState(false);

  const handleSortPath = async path => {
    setSorting(true);
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
        <Dropdown
          className={styles.sortButton}
          closeOnClick
          dropdownClassName={styles.sortList}
          icon="sort"
          iconClassName={styles.sortIcon}
          offset={0}
          text={sortOptions.find(option => option.sortPath === sortPath).title}
          textLink
          title="Sort releases."
        >
          {sortOptions.map(option => (
            <li className={styles.sortItem} key={option.title} onClick={() => handleSortPath(option.sortPath)}>
              {option.title}
            </li>
          ))}
        </Dropdown>
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
