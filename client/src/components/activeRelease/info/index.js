import PropTypes from 'prop-types';
import React from 'react';

const Info = ({ info }) => {
  if (!info) return null;

  return (
    <>
      <h6 className="yellow mt-4">Info</h6>
      <p className="info">{info}</p>
    </>
  );
};

Info.propTypes = {
  info: PropTypes.string
};

export default Info;
