import React from 'react';
import styles from '../../style/SelectedRelease.module.css';

const PLine = ({ pLine }) => {
  if (!pLine) return null;

  return (
    <div className={`${styles.copyright} red`}>
      &#8471; {pLine.year} {pLine.owner}
    </div>
  );
};

export default PLine;
