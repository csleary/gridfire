import FontAwesome from 'react-fontawesome';
import PropTypes from 'prop-types';
import React from 'react';
import moment from 'moment';

const ReleaseDate = ({ releaseDate }) => {
  return (
    <h6>
      <FontAwesome name="calendar-o" className="mr-2 yellow" />
      {moment(new Date(releaseDate)).format('Do of MMM, YYYY')}
    </h6>
  );
};

ReleaseDate.propTypes = {
  releaseDate: PropTypes.string
};

export default ReleaseDate;
