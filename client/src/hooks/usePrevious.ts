import { useEffect, useRef } from "react";

const usePrevious = <T>(value: T) => {
  const ref = useRef<T>(null);

  useEffect(() => {
    ref.current = value;
  }, [ref, value]);

  return ref.current;
};

export { usePrevious };
