import React from 'react';

const CatNumber = ({ catNumber }) => {
  if (!catNumber) return null;

  return (
    <h6>
      <span className="red">Cat.:</span> {catNumber}
    </h6>
  );
};

export default CatNumber;
