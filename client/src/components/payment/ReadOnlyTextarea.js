import React, { useEffect, useRef, useState } from 'react';
import FontAwesome from 'react-fontawesome';
import classnames from 'classnames';
import styles from '../../style/PaymentTextarea.module.css';

const ReadOnlyTextarea = props => {
  const textArea = useRef(null);
  const [hasCopied, setHasCopied] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setHasCopied(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, [hasCopied]);

  const handleClick = event => {
    if (event.keyCode && event.keyCode !== 13) return;
    textArea.current.select();
    document.execCommand('copy');
    setHasCopied(true);
  };

  const copySuccessClass = classnames(styles.success, {
    [styles.show]: hasCopied
  });

  return (
    <div className="position-relative">
      <textarea
        className={`${styles.textarea} form-control text-center ibm-type-mono mb-5`}
        onClick={handleClick}
        onKeyDown={handleClick}
        placeholder={props.placeholder}
        ref={textArea}
        value={props.text}
        readOnly
      />
      <FontAwesome className={styles.icon} name="copy" />
      <div className={copySuccessClass}>
        <FontAwesome className="mr-2" name="thumbs-up" />
        Copied to clipboard!
      </div>
    </div>
  );
};

export default ReadOnlyTextarea;
