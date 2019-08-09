import React from 'react';

const Info = ({ info }) => {
  if (!info) return null;

  return (
    <>
      <h6 className="red mt-4">Info</h6>
      <p className="info">{info}</p>
    </>
  );
};

export default Info;
