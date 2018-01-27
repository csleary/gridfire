import React from 'react';
import '../style/readOnlyTextarea.css';

const ReadOnlyTextarea = props => (
  <textarea
    className="form-control text-center ibm-type-mono disabled-textarea"
    onClick={() => {}}
    placeholder={props.placeholder}
    value={props.text}
    readOnly
  />
);

export default ReadOnlyTextarea;
