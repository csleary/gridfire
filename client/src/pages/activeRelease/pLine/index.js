import PropTypes from 'prop-types';
import React from 'react';
import styles from './pLine.module.css';

const PLine = ({ recName, recYear }) => {
  if (!recName && !recYear) return null;

  return (
    <div className={styles.copyright}>
      &#8471; {recYear} {recName}
    </div>
  );
};

PLine.propTypes = {
  recName: PropTypes.string,
  recYear: PropTypes.number
};

export default PLine;
