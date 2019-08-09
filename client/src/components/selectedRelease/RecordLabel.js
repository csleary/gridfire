import React from 'react';

const RecordLabel = ({ recordLabel }) => {
  if (!recordLabel) return null;

  return (
    <h6>
      <span className="red">Label:</span> {recordLabel}
    </h6>
  );
};

export default RecordLabel;
