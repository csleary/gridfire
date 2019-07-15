import { useEffect, useRef } from 'react';

const sortNumbers = (array, property) => {
  const sortFunction = (a, b) => {
    if (a[property] < b[property]) return -1;
    if (a[property] > b[property]) return 1;
    return 0;
  };
  return array.sort(sortFunction);
};

const sortStrings = (array, property) => {
  const sortFunction = (a, b) => {
    if (a[property].toUpperCase() < b[property].toUpperCase()) return -1;
    if (a[property].toUpperCase() > b[property].toUpperCase()) return 1;
    return 0;
  };
  return array.sort(sortFunction);
};

const usePrevious = value => {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
};

export { sortNumbers, sortStrings, usePrevious };
