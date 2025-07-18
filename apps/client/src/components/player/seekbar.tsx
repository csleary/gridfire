import { Box, useColorModeValue } from "@chakra-ui/react";
import { MouseEventHandler, RefObject } from "react";

interface BufferRange {
  end: number;
  start: number;
}

interface Props {
  audioPlayerRef: RefObject<HTMLAudioElement | null>;
  bufferRanges: Array<BufferRange>;
  handleSeek: MouseEventHandler;
  progressPercent: number;
  seekBarRef: RefObject<HTMLDivElement | null>;
}

const SeekBar = ({ audioPlayerRef, bufferRanges, handleSeek, progressPercent, seekBarRef }: Props) => {
  return (
    <Box
      _groupHover={{ background: "gray.200", cursor: "pointer", height: "8px", marginTop: "6px" }}
      background="gray.300"
      height="4px"
      onClick={handleSeek}
      position="relative"
      ref={seekBarRef}
      role="button"
      tabIndex={-1}
      transition="0.125s cubic-bezier(0.2, 0.8, 0.4, 1)"
      width="100%"
    >
      {bufferRanges.map(({ end, start }: BufferRange) => {
        const { duration } = audioPlayerRef.current!;
        const left = (start / duration) * 100;
        const width = ((end - start) / duration) * 100;

        return (
          <Box
            background="gray.600"
            height="100%"
            key={start}
            left={`${left || 0}%`}
            position="absolute"
            transition="width 0.125s cubic-bezier(0.2, 0.8, 0.4, 1)"
            width={`${width || 0}%`}
          />
        );
      })}
      <Box
        background={useColorModeValue("yellow.400", "purple.400")}
        height="100%"
        position="absolute"
        transition="0.125s cubic-bezier(0.2, 0.8, 0.4, 1)"
        width={`${progressPercent * 100}%`}
      />
    </Box>
  );
};

export default SeekBar;
