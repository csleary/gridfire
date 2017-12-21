import React from 'react';
import FontAwesome from 'react-fontawesome';
import '../style/spinner.css';

const Spinner = (props) => {
  let styleClass = 'spinner';
  if (props.setClass) styleClass = props.setClass;
  return (
    <div className="text-center">
      <div className="spinner-message">{props.message}</div>
      <FontAwesome name="circle-o-notch" spin className={styleClass} />
    </div>
  );
};

export default Spinner;
