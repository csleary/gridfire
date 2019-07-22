import FontAwesome from 'react-fontawesome';
import React from 'react';

const Spinner = ({ children }) => (
  <main className="container d-flex align-items-center justify-content-center">
    <div className="row mb-5">
      <div className="col text-center py-3">
        {children}
        <FontAwesome name="circle-o-notch" spin className="spinner" />
      </div>
    </div>
  </main>
);

export default Spinner;
