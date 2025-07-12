import { Box } from "@chakra-ui/react";
import { useState } from "react";

interface Props {
  elapsedTime: string;
  remainingTime: string;
}

const PlaybackTime = ({ elapsedTime, remainingTime }: Props) => {
  const [showRemaining, setShowRemaining] = useState(false);

  return (
    <Box
      _hover={{ "&:active": { background: "none" }, color: "gray.100" }}
      display="inline-block"
      flex="0 1 8rem"
      onClick={() => setShowRemaining(prev => !prev)}
      padding="0 1rem"
      role="button"
      tabIndex={-1}
      textAlign="right"
      transition="0.5s cubic-bezier(0.2, 0.8, 0.4, 1)"
      userSelect="none"
    >
      {showRemaining ? remainingTime : elapsedTime}
    </Box>
  );
};

export default PlaybackTime;
