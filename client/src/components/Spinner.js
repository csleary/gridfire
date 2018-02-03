import React from 'react';
import FontAwesome from 'react-fontawesome';
import '../style/spinner.css';

const Spinner = props => (
  <main className="container d-flex align-items-center justify-content-center">
    <div className="row">
      <div className="col text-center">
        {props.children && (
          <div className="spinner-message">{props.children}</div>
        )}
        <FontAwesome name="circle-o-notch" spin className="spinner" />
      </div>
    </div>
  </main>
);

export default Spinner;
