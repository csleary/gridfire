import React from 'react';
import '../../style/progressBar.css';

const ProgressBar = ({ percentComplete, willDisplay }) => {
  if (willDisplay) {
    return (
      <div
        className="progress-bar"
        style={{
          width: `${percentComplete}%`
        }}
      />
    );
  }
  return null;
};

export default ProgressBar;
