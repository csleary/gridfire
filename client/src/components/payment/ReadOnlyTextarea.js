import React, { useRef, useState, useEffect } from 'react';
import FontAwesome from 'react-fontawesome';
import classnames from 'classnames';
import '../../style/readOnlyTextarea.css';

const ReadOnlyTextarea = props => {
  const textArea = useRef(null);
  const [hasCopied, setHasCopied] = useState(false);

  useEffect(
    () => {
      const timer = setTimeout(() => {
        setHasCopied(false);
      }, 5000);

      return () => clearTimeout(timer);
    },
    [hasCopied]
  );

  const handleClick = event => {
    if (event.keyCode && event.keyCode !== 13) return;
    textArea.current.select();
    document.execCommand('copy');
    setHasCopied(true);
  };

  const copySuccessClass = classnames('copy-success', {
    show: hasCopied
  });

  return (
    <div className="row no-gutters justify-content-center">
      <div className="col-md-8 position-relative">
        <textarea
          className="form-control text-center ibm-type-mono disabled-textarea mb-5 p-2"
          onClick={handleClick}
          onKeyDown={handleClick}
          placeholder={props.placeholder}
          ref={textArea}
          value={props.text}
          readOnly
        />
        <FontAwesome className="copy-icon" name="copy" />
        <div className={copySuccessClass}>
          Copied to clipboard!
          <FontAwesome className="ml-2" name="thumbs-up" />
        </div>
      </div>
    </div>
  );
};

export default ReadOnlyTextarea;
