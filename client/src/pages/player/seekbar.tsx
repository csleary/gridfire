import { Box, useColorModeValue } from "@chakra-ui/react";
import { MouseEvent, MutableRefObject } from "react";

interface BufferRange {
  end: number;
  start: number;
}

interface Props {
  audioPlayerRef: MutableRefObject<HTMLAudioElement | { duration: number }>;
  bufferRanges: Array<BufferRange>;
  handleSeek: (e: MouseEvent) => void;
  progressPercent: number;
  seekBarRef: MutableRefObject<HTMLDivElement | null>;
}

const SeekBar = ({ audioPlayerRef, bufferRanges, handleSeek, progressPercent, seekBarRef }: Props) => {
  return (
    <Box
      onClick={handleSeek}
      ref={seekBarRef}
      role="button"
      tabIndex={-1}
      background="gray.300"
      height="4px"
      position="relative"
      transition="0.125s cubic-bezier(0.2, 0.8, 0.4, 1)"
      width="100%"
      _groupHover={{ background: "gray.200", cursor: "pointer", height: "8px", marginTop: "6px" }}
    >
      {bufferRanges.map(({ start, end }: BufferRange) => {
        const { duration } = audioPlayerRef.current;
        const left = (start / duration) * 100;
        const width = ((end - start) / duration) * 100;

        return (
          <Box
            key={start}
            background="gray.600"
            height="100%"
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
