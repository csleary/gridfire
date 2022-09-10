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
      role="button"
      onClick={() => setShowRemaining(prev => !prev)}
      tabIndex={-1}
      display="inline-block"
      flex="0 1 8rem"
      padding="0 1rem"
      textAlign="right"
      transition="0.5s cubic-bezier(0.2, 0.8, 0.4, 1)"
      userSelect="none"
      _hover={{ "&:active": { background: "none" }, color: "gray.100" }}
    >
      {showRemaining ? remainingTime : elapsedTime}
    </Box>
  );
};

export default PlaybackTime;
