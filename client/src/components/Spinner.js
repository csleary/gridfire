import React from 'react';
import FontAwesome from 'react-fontawesome';

const Spinner = props => (
  <main className="container d-flex align-items-center justify-content-center">
    <div className="row mb-5">
      <div className="col text-center">
        {props.children}
        <FontAwesome name="circle-o-notch" spin className="spinner" />
      </div>
    </div>
  </main>
);

export default Spinner;
