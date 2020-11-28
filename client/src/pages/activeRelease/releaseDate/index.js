import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import PropTypes from 'prop-types';
import React from 'react';
import { faCalendar } from '@fortawesome/free-regular-svg-icons';
import moment from 'moment';
import styles from './releaseDate.module.css';

const ReleaseDate = ({ releaseDate }) => {
  return (
    <h6>
      <FontAwesomeIcon icon={faCalendar} className={styles.icon} title="Release date" />
      {moment(new Date(releaseDate)).format('Do of MMM, YYYY')}
    </h6>
  );
};

ReleaseDate.propTypes = {
  releaseDate: PropTypes.string
};

export default ReleaseDate;
