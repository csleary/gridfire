import React, { useEffect, useRef, useState } from 'react';
import FontAwesome from 'react-fontawesome';
import PropTypes from 'prop-types';
import styles from './readOnlyTextarea.module.css';

const ReadOnlyTextarea = props => {
  const copyText = useRef(null);
  const [hasCopied, setHasCopied] = useState(false);

  useEffect(() => {
    const timer = setTimeout(
      () => {
        setHasCopied(false);
      },
      5000,
      [hasCopied]
    );

    return () => clearTimeout(timer);
  }, [hasCopied]);

  const handleClick = () => {
    if (hasCopied) {
      return setHasCopied(false);
    }

    const range = document.createRange();
    range.selectNode(copyText.current);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
    document.execCommand('copy');
    window.getSelection().removeAllRanges();
    setHasCopied(true);
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.copyText} onClick={handleClick} onKeyDown={handleClick} ref={copyText}>
        {hasCopied ? (
          <div className={styles.success}>
            <FontAwesome className={styles.iconSuccess} name="thumbs-up" />
            Copied to clipboard!
          </div>
        ) : props.text ? (
          props.text
        ) : (
          props.placeholder
        )}
      </div>
      <FontAwesome className={styles.icon} name="copy" />
    </div>
  );
};

ReadOnlyTextarea.propTypes = {
  placeholder: PropTypes.string,
  text: PropTypes.string
};

export default ReadOnlyTextarea;
