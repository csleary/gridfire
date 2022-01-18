import { useCallback, useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Box } from "@chakra-ui/react";

const chars = {
  braille: ["⣾", "⣽", "⣻", "⢿", "⡿", "⣟", "⣯", "⣷"],
  circular: [
    "⢀⠀",
    "⡀⠀",
    "⠄⠀",
    "⢂⠀",
    "⡂⠀",
    "⠅⠀",
    "⢃⠀",
    "⡃⠀",
    "⠍⠀",
    "⢋⠀",
    "⡋⠀",
    "⠍⠁",
    "⢋⠁",
    "⡋⠁",
    "⠍⠉",
    "⠋⠉",
    "⠋⠉",
    "⠉⠙",
    "⠉⠙",
    "⠉⠩",
    "⠈⢙",
    "⠈⡙",
    "⢈⠩",
    "⡀⢙",
    "⠄⡙",
    "⢂⠩",
    "⡂⢘",
    "⠅⡘",
    "⢃⠨",
    "⡃⢐",
    "⠍⡐",
    "⢋⠠",
    "⡋⢀",
    "⠍⡁",
    "⢋⠁",
    "⡋⠁",
    "⠍⠉",
    "⠋⠉",
    "⠋⠉",
    "⠉⠙",
    "⠉⠙",
    "⠉⠩",
    "⠈⢙",
    "⠈⡙",
    "⠈⠩",
    "⠀⢙",
    "⠀⡙",
    "⠀⠩",
    "⠀⢘",
    "⠀⡘",
    "⠀⠨",
    "⠀⢐",
    "⠀⡐",
    "⠀⠠",
    "⠀⢀",
    "⠀⡀"
  ],
  nemp3: ["⠝", "⠑", "⠍", "⠏", "⠒"],
  dots: ["", ".", "..", "..."],
  lines: ["|", "/", "\u2013", "\\"]
};

const TextSpinner = ({ className, isActive = true, type = "nemp3", speed = 0.005 }) => {
  const [count, setCount] = useState(0);
  const requestRef = useRef();
  const previousTimeRef = useRef();
  const isUnmounting = useRef(false);

  const draw = useCallback(
    time => {
      if (previousTimeRef.current !== undefined) {
        const deltaTime = time - previousTimeRef.current;
        if (isUnmounting.current) return;
        setCount(prevCount => (prevCount + deltaTime * speed) % chars[type].length);
      }

      previousTimeRef.current = time;
      requestRef.current = requestAnimationFrame(draw);
    },
    [speed, type]
  );

  useEffect(() => {
    isUnmounting.current = false;
    if (isActive) requestRef.current = requestAnimationFrame(draw);

    return () => {
      isUnmounting.current = true;
      cancelAnimationFrame(requestRef.current);
    };
  }, [draw, isActive]);

  return (
    <Box display="inline-block" mr={4}>
      {chars[type][Math.floor(count)]}
    </Box>
  );
};

TextSpinner.propTypes = {
  className: PropTypes.string,
  isActive: PropTypes.bool,
  type: PropTypes.string,
  speed: PropTypes.number
};

export default TextSpinner;
