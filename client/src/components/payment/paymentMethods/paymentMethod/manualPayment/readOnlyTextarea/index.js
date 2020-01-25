import React, { useEffect, useRef, useState } from 'react';
import FontAwesome from 'react-fontawesome';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import styles from './readOnlyTextarea.module.css';

const ReadOnlyTextarea = props => {
  const copyText = useRef(null);
  const [hasCopied, setHasCopied] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setHasCopied(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, [hasCopied]);

  const handleClick = event => {
    if (event.keyCode && event.keyCode !== 13) return;
    const range = document.createRange();
    range.selectNode(copyText.current);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
    document.execCommand('copy');
    window.getSelection().removeAllRanges();
    setHasCopied(true);
  };

  const copySuccessClass = classnames(styles.success, {
    [styles.show]: hasCopied
  });

  return (
    <div className={styles.wrapper}>
      <div
        className={`${styles.copyText} ibm-type-mono`}
        onClick={handleClick}
        onKeyDown={handleClick}
        ref={copyText}
      >
        {props.text ? props.text : props.placeholder}
      </div>
      <FontAwesome className={styles.icon} name="copy" />
      <div className={copySuccessClass}>
        <FontAwesome className="mr-2" name="thumbs-up" />
        Copied to clipboard!
      </div>
    </div>
  );
};

ReadOnlyTextarea.propTypes = {
  placeholder: PropTypes.string,
  text: PropTypes.string
};

export default ReadOnlyTextarea;
