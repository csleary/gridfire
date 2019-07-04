import React from 'react';
import FontAwesome from 'react-fontawesome';

const StatusIcon = ({ published, releaseTitle }) => {
  if (published) {
    return (
      <div className="status-icon-bg d-flex align-items-center justify-content-center">
        <FontAwesome
          name="check-circle"
          className="cyan status-icon"
          title={`'${releaseTitle}' is live and available for purchase.`}
        />
      </div>
    );
  }
  return (
    <div className="status-icon-bg d-flex align-items-center justify-content-center">
      <FontAwesome
        name="exclamation-circle"
        className="yellow status-icon"
        title={`'${releaseTitle}' is currently offline.`}
      />
    </div>
  );
};

export default StatusIcon;
