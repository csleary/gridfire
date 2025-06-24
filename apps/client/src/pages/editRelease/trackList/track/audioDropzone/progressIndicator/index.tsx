import { Box, CircularProgress, CircularProgressLabel, Tooltip, useColorModeValue } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { EntityId } from "@reduxjs/toolkit";
import { useSelector } from "hooks";
import { ReactElement, memo } from "react";
import { shallowEqual } from "react-redux";

const pulsing = keyframes`from { opacity: 0; } to { opacity: 1; }`;
const animation = `${pulsing} 500ms cubic-bezier(0, 0.85, 0.15, 1) alternate infinite 250ms`;

interface Props {
  color: string;
  isComplete?: boolean;
  labelColor?: string;
  progress?: number;
  stageHasStarted?: boolean;
  stageName?: string;
  children?: ReactElement;
  tooltipText?: string;
  trackId?: EntityId;
}

const ProgressIndicator = ({
  color,
  isComplete = false,
  labelColor = color,
  progress = 0,
  stageHasStarted = false,
  stageName = "",
  tooltipText,
  trackId = "",
  children = <Box as="span">{stageName.toUpperCase()}</Box>
}: Props) => {
  const errors = useSelector(state => state.tracks.pipelineErrors[trackId], shallowEqual);
  const error = errors?.[stageName];

  return (
    <CircularProgress
      animation={error != null ? animation : undefined}
      color={error != null ? "red.400" : color}
      isIndeterminate={error != null ? false : stageHasStarted && !progress}
      size="4rem"
      thickness=".75rem"
      trackColor={useColorModeValue("gray.300", "gray.600")}
      value={isComplete ? 100 : progress || 0}
    >
      <Tooltip label={tooltipText}>
        <CircularProgressLabel
          animation={error != null ? animation : undefined}
          color={error != null ? "red.400" : isComplete || stageHasStarted ? labelColor : "gray.600"}
          transition="color 0.5s cubic-bezier(0.2, 0.8, 0.4, 1)"
        >
          {progress === 100 ? children : progress || children}
        </CircularProgressLabel>
      </Tooltip>
    </CircularProgress>
  );
};

export default memo(ProgressIndicator);
