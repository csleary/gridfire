import React from 'react';
import '../style/progressBar.css';

const ProgressBar = (props) => {
  if (props.willDisplay) {
    return (
      <div
        className="progress-bar"
        style={{
          width: `${props.percentComplete}%`
        }}
      />
    );
  }
  return null;
};

export default ProgressBar;
