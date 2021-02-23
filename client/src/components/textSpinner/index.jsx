import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import styles from './textSpinner.module.css';

const TextSpinner = ({ lines }) => {
  const chars = {
    dots: ['', '.', '..', '...'],
    lines: ['|', '/', '\u2013', '\\']
  };

  const [count, setCount] = useState(0);
  const requestRef = useRef();
  const previousTimeRef = useRef();
  const type = lines ? 'lines' : 'dots';
  const timeFactor = lines ? 0.01 : 0.005;

  const draw = time => {
    if (previousTimeRef.current !== undefined) {
      const deltaTime = time - previousTimeRef.current;
      setCount(prevCount => (prevCount + deltaTime * timeFactor) % chars[type].length);
    }

    previousTimeRef.current = time;
    requestRef.current = requestAnimationFrame(draw);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(requestRef.current);
  }, []); // eslint-disable-line

  return (
    <div className={classnames(styles.root, lines ? styles.lines : styles.dots)}>{chars[type][Math.floor(count)]}</div>
  );
};

TextSpinner.propTypes = {
  lines: PropTypes.string
};

export default TextSpinner;
