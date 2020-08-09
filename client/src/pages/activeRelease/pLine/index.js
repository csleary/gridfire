import PropTypes from 'prop-types';
import React from 'react';
import styles from './pLine.module.css';

const PLine = ({ pLine }) => {
  if (!pLine) return null;

  return (
    <div className={`${styles.copyright} yellow`}>
      &#8471; {pLine.year} {pLine.owner}
    </div>
  );
};

PLine.propTypes = {
  pLine: PropTypes.object
};

export default PLine;
