import React, { useRef, useState } from 'react';
import { faCog, faSort } from '@fortawesome/free-solid-svg-icons';
import Button from 'components/button';
import Dropdown from 'components/dropdown';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
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

const SortReleases = ({
  handleFetchCatalogue,
  currentSortOrder,
  currentSortPath,
  setCurrentSortOrder,
  setCurrentSortPath
}) => {
  const sortRef = useRef();
  const [isSorting, setIsSorting] = useState(false);

  const handleSortPath = async sortBy => {
    setIsSorting(true);
    await handleFetchCatalogue({ sortBy, sortOrder: currentSortOrder });
    setCurrentSortPath(sortBy);
    setIsSorting(false);
  };

  const handleSortOrder = async sortOrder => {
    setIsSorting(true);
    await handleFetchCatalogue({ sortBy: currentSortPath, sortOrder });
    setCurrentSortOrder(sortOrder);
    setIsSorting(false);
  };

  return (
    <div className={styles.sort} ref={sortRef}>
      <div className={styles.buttons}>
        <Dropdown
          className={styles.sortButton}
          closeOnClick
          dropdownClassName={styles.sortList}
          icon={faSort}
          iconClassName={styles.sortIcon}
          offset={0}
          text={sortOptions.find(option => option.sortPath === currentSortPath).title}
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
          onClick={() => handleSortOrder(currentSortOrder * -1)}
          textLink
        >
          {`(${sortOptions.find(option => option.sortPath === currentSortPath)[currentSortOrder.toString()]})`}
        </Button>
        {isSorting ? <FontAwesomeIcon icon={faCog} spin /> : null}
      </div>
    </div>
  );
};

SortReleases.propTypes = {
  handleFetchCatalogue: PropTypes.func,
  currentSortPath: PropTypes.string,
  setCurrentSortPath: PropTypes.func,
  currentSortOrder: PropTypes.number,
  setCurrentSortOrder: PropTypes.func
};

export default SortReleases;
