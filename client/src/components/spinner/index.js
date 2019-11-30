import FontAwesome from 'react-fontawesome';
import PropTypes from 'prop-types';
import React from 'react';
import { spinner } from './spinner.module.css';

const Spinner = ({ children }) => (
  <main className="container d-flex align-items-center justify-content-center">
    <div className="row mb-5">
      <div className="col text-center py-3">
        {children}
        <FontAwesome name="circle-o-notch" spin className={spinner} />
      </div>
    </div>
  </main>
);

Spinner.propTypes = { children: PropTypes.object };

export default Spinner;
