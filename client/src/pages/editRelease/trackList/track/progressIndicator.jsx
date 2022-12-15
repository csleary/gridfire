import { CircularProgress, CircularProgressLabel, Tooltip, keyframes, useColorModeValue } from "@chakra-ui/react";
import { shallowEqual, useSelector } from "react-redux";

const pulsing = keyframes`from { opacity: 0; } to { opacity: 1; }`;
const animation = `${pulsing} 500ms cubic-bezier(0, 0.85, 0.15, 1) alternate infinite 250ms`;

const ProgressIndicator = ({
  color,
  isStored = false,
  labelColor = color,
  progress = 0,
  stageHasStarted = false,
  stageName = "",
  children = stageName.toUpperCase(),
  tooltipText,
  trackId = ""
}) => {
  const { [trackId]: errors = {} } = useSelector(state => state.tracks.pipelineErrors, shallowEqual);
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
          animation={error != null ? animation : false}
          color={error != null ? "red.400" : isStored || stageHasStarted ? labelColor : "gray.600"}
          transition="color 0.5s cubic-bezier(0.2, 0.8, 0.4, 1)"
        >
          {progress === 100 ? children : progress || children}
        </CircularProgressLabel>
      </Tooltip>
    </CircularProgress>
  );
};

export default ProgressIndicator;
