import PropTypes from 'prop-types';
import React from 'react';

const RecordLabel = ({ recordLabel }) => {
  if (!recordLabel) return null;

  return (
    <h6>
      <span className="red">Label:</span> {recordLabel}
    </h6>
  );
};

RecordLabel.propTypes = {
  recordLabel: PropTypes.string
};

export default RecordLabel;
