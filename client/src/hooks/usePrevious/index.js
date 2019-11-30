import { useEffect, useRef } from 'react';

const usePrevious = value => {
  const ref = useRef;

  useEffect(() => {
    ref.current = value;
  }, [ref, value]);

  return ref.current;
};

export { usePrevious };
