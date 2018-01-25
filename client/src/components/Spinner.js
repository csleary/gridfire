import React from 'react';
import FontAwesome from 'react-fontawesome';
import '../style/spinner.css';

const Spinner = props => {
  let styleClass = 'spinner';
  if (props.setClass) styleClass = props.setClass;
  return (
    <main className="container d-flex align-items-center justify-content-center">
      <div className="row">
        <div className="col text-center">
          {props.message && (
            <div className="spinner-message">{props.message}</div>
          )}
          <FontAwesome name="circle-o-notch" spin className={styleClass} />
        </div>
      </div>
    </main>
  );
};

export default Spinner;
