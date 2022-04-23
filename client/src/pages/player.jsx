import { Box, Flex, IconButton, Spacer, Text, useColorModeValue } from "@chakra-ui/react";
import { faChevronDown, faCog, faPause, faPlay, faStop } from "@fortawesome/free-solid-svg-icons";
import { Link as RouterLink } from "react-router-dom";
import Icon from "components/icon";
import useAudioPlayer from "hooks/useAudioPlayer";
import { shallowEqual, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";

const Player = () => {
  const { player } = useSelector(state => state, shallowEqual);
  const { pathname } = useLocation();
  const { artistName, isPlaying, releaseId, showPlayer, trackTitle } = player;

  const {
    audioPlayerRef,
    bufferRanges,
    duration,
    elapsedTime,
    hidePlayer,
    playAudio,
    seekAudio,
    stopAudio,
    isReady,
    progressPercent,
    remainingTime,
    seekBarRef,
    setShowRemaining,
    showRemaining
  } = useAudioPlayer();

  return (
    <Box
      role="group"
      background="gray.800"
      bottom="0"
      color="gray.300"
      fontSize="2rem"
      left="0"
      position="fixed"
      right="0"
      transform={showPlayer ? "translateY(0)" : "translateY(100%)"}
      transition="0.5s cubic-bezier(0.2, 0.8, 0.4, 1)"
      visibility={showPlayer ? "visible" : "hidden"}
      zIndex="1030"
    >
      <audio id="player" ref={el => (audioPlayerRef.current = el)} />
      <Box
        onClick={seekAudio}
        ref={seekBarRef}
        role="button"
        tabIndex="-1"
        background="gray.300"
        height="4px"
        position="relative"
        transition="0.125s cubic-bezier(0.2, 0.8, 0.4, 1)"
        width="100%"
        _groupHover={{ background: "gray.200", cursor: "pointer", height: "8px", marginTop: "6px" }}
      >
        {bufferRanges.map(([start, end]) => {
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
      <Flex alignItems="center" flex="1" justifyContent="center" height="3.25rem">
        <Flex flex="1 1 50%" justifyContent="flex-end">
          <IconButton
            icon={<Icon icon={!isReady ? faCog : isPlaying ? faPause : faPlay} fixedWidth spin={!isReady} />}
            onClick={playAudio}
            variant="ghost"
            fontSize="2rem"
            mr={2}
            _hover={{ "&:active": { background: "none" }, color: "gray.100" }}
          />
          <IconButton
            icon={<Icon icon={faStop} fixedWidth />}
            onClick={stopAudio}
            fontSize="2rem"
            mr={2}
            variant="ghost"
            _hover={{ "&:active": { background: "none" }, color: "gray.100" }}
          />
        </Flex>
        <Box
          role="button"
          onClick={() => setShowRemaining(prev => !prev)}
          tabIndex="-1"
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
        <Flex
          alignItems="center"
          flex="1 1 50%"
          overflow="hidden"
          pl={[1, 4]}
          textAlign="left"
          textOverflow="ellipsis"
          whiteSpace="nowrap"
        >
          {!isReady ? (
            <Text>Loading&hellip;</Text>
          ) : pathname === `/release/${releaseId}` ? (
            <Text>
              {artistName} &bull; <Text as="em">{trackTitle}</Text>
            </Text>
          ) : (
            <Text as={RouterLink} to={`/release/${releaseId}`}>
              {artistName} &bull; <Text as="em">{trackTitle}</Text>
            </Text>
          )}
        </Flex>
        <Spacer />
        <IconButton
          icon={<Icon icon={faChevronDown} />}
          mx={[1, 4]}
          onClick={hidePlayer}
          title="Hide player (will stop audio)"
          variant="ghost"
          _hover={{ "&:active": { background: "none" }, color: "gray.100" }}
        />
      </Flex>
    </Box>
  );
};

export default Player;
