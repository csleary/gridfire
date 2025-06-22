import { Box, CircularProgress, CircularProgressLabel, Tooltip, useColorModeValue } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { EntityId } from "@reduxjs/toolkit";
import { useSelector } from "hooks";
import { ReactElement, memo } from "react";
import { shallowEqual } from "react-redux";

const pulsing = keyframes`from { opacity: 0; } to { opacity: 1; }`;
const animation = `${pulsing} 500ms cubic-bezier(0, 0.85, 0.15, 1) alternate infinite 250ms`;

type PipeLineErrors = {
  [key: string]: { [key: string]: string };
};

interface Props {
  color: string;
  isStored?: boolean;
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
  isStored = false,
  labelColor = color,
  progress = 0,
  stageHasStarted = false,
  stageName = "",
  children = <Box as="span">{stageName.toUpperCase()}</Box>,
  tooltipText,
  trackId = ""
}: Props) => {
  const { [trackId]: errors = {} } = useSelector(state => state.tracks.pipelineErrors as PipeLineErrors, shallowEqual);
  const error = errors[stageName];

  return (
    <CircularProgress
      trackColor={useColorModeValue("gray.300", "gray.600")}
      color={color}
      size="4rem"
      thickness=".75rem"
      value={isStored ? 100 : progress || 0}
      isIndeterminate={error != null ? false : stageHasStarted && !progress}
    >
      <Tooltip label={tooltipText}>
        <CircularProgressLabel
          animation={error != null ? animation : undefined}
          color={error != null ? "red.400" : isStored || stageHasStarted ? labelColor : "gray.600"}
          transition="color 0.5s cubic-bezier(0.2, 0.8, 0.4, 1)"
        >
          {progress === 100 ? children : progress || children}
        </CircularProgressLabel>
      </Tooltip>
    </CircularProgress>
  );
};

export default memo(ProgressIndicator);
