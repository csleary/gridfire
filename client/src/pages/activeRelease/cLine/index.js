import PropTypes from 'prop-types';
import React from 'react';
import styles from './cLine.module.css';

const CLine = ({ pubName, pubYear }) => {
  if (!pubName && !pubYear) return null;

  return (
    <div className={styles.copyright}>
      &copy; {pubYear} {pubName}
    </div>
  );
};

CLine.propTypes = {
  recName: PropTypes.string,
  recYear: PropTypes.number
};

export default CLine;
