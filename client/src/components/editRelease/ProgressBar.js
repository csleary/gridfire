import '../../style/progressBar.css';
import React from 'react';

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
