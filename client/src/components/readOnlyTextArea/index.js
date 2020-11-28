import React, { useEffect, useRef, useState } from 'react';
import { faCopy, faThumbsUp } from '@fortawesome/free-regular-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import styles from './readOnlyTextArea.module.css';

const ReadOnlyTextArea = ({ className, label = false, placeholder = '', text, ...rest }) => {
  const copyText = useRef();
  const [hasCopied, setHasCopied] = useState(false);

  useEffect(() => {
    let timer;
    if (hasCopied) timer = setTimeout(setHasCopied, 3000, false);
    return () => clearTimeout(timer);
  }, [hasCopied]);

  const handleClick = () => {
    if (hasCopied) return setHasCopied(false);
    const range = document.createRange();
    range.selectNode(copyText.current);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
    document.execCommand('copy');
    window.getSelection().removeAllRanges();
    setHasCopied(true);
  };

  const textClassNames = classnames(styles.copyText, { [className]: className });

  return (
    <>
      {label ? <div className={styles.label}>{label}</div> : null}
      <div className={styles.wrapper}>
        <div
          className={textClassNames}
          onClick={handleClick}
          onKeyDown={handleClick}
          rest={rest}
          ref={ref => (copyText.current = ref)}
        >
          {hasCopied ? (
            <div className={styles.success}>
              <FontAwesomeIcon className={styles.iconSuccess} icon={faThumbsUp} />
              Copied to clipboard!
            </div>
          ) : text ? (
            text
          ) : (
            placeholder
          )}
        </div>
        <FontAwesomeIcon className={styles.icon} icon={faCopy} />
      </div>
    </>
  );
};

ReadOnlyTextArea.propTypes = {
  className: PropTypes.string,
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  placeholder: PropTypes.string,
  text: PropTypes.string
};

export default ReadOnlyTextArea;
