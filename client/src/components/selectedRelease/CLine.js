import React from 'react';
import styles from '../../style/SelectedRelease.module.css';

const CLine = ({ cLine }) => {
  if (!cLine) return null;

  return (
    <div className={`${styles.copyright} red`}>
      &copy; {cLine.year} {cLine.owner}
    </div>
  );
};

export default CLine;
