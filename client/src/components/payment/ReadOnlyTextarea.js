import React from 'react';
import '../../style/readOnlyTextarea.css';

const ReadOnlyTextarea = props => (
  <div className="row justify-content-center">
    <div className="col-md-8">
      <textarea
        className="form-control text-center ibm-type-mono disabled-textarea mb-5 p-2"
        onClick={() => {}}
        placeholder={props.placeholder}
        value={props.text}
        readOnly
      />
    </div>
  </div>
);

export default ReadOnlyTextarea;
