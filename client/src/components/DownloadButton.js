import React from 'react';
import FontAwesome from 'react-fontawesome';

const DownloadButton = () => (
  <form action="/download">
    <button className="btn btn-outline-success btn-lg btn-block">
      Download Release
      <FontAwesome name="download" className="button-icon" />
    </button>
  </form>
);

export default DownloadButton;
