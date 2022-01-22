import { Box, Flex, IconButton, Text } from "@chakra-ui/react";
import { faChevronDown, faCog, faPause, faPlay, faStop } from "@fortawesome/free-solid-svg-icons";
import { Link as RouterLink } from "react-router-dom";
import Icon from "components/icon";
import usePlayer from "hooks/usePlayer";
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
    handleHidePlayer,
    handlePlayButton,
    handleSeek,
    handleStop,
    isReady,
    percentComplete,
    remainingTime,
    seekBarRef,
    setShowRemaining,
    showRemaining
  } = usePlayer();

  return (
    <Box
      role="group"
      background="gray.800"
      bottom="0"
      color="gray.400"
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
        onClick={handleSeek}
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
              background="red.200"
              height="100%"
              left={`${left || 0}%`}
              position="absolute"
              width={`${width || 0}%`}
            />
          );
        })}
        <Box
          background="gray.400"
          height="100%"
          position="absolute"
          transition="0.125s cubic-bezier(0.2, 0.8, 0.4, 1)"
          width={`${percentComplete * 100}%`}
          _groupHover={{ background: "cyan.200" }}
        />
      </Box>
      <Flex alignItems="center" justifyContent="center" height="3.25rem">
        <IconButton
          icon={<Icon icon={!isReady ? faCog : isPlaying ? faPause : faPlay} fixedWidth spin={!isReady} />}
          onClick={handlePlayButton}
          mr={2}
          variant="ghost"
        />
        <IconButton
          icon={<Icon icon={faStop} fixedWidth />}
          onClick={handleStop}
          margin="0 0.5rem 0 0"
          transition="color 0.5s cubic-bezier(0.2, 0.8, 0.4, 1)"
          variant="ghost"
        />
        <Box
          role="button"
          onClick={() => setShowRemaining(prev => !prev)}
          tabIndex="-1"
          display="inline-block"
          padding="0 1rem"
          textAlign="right"
          transition="0.5s cubic-bezier(0.2, 0.8, 0.4, 1)"
          userSelect="none"
          width="8rem"
          _focus={{ outline: "none" }}
        >
          {showRemaining ? remainingTime : elapsedTime}
        </Box>
        <Flex
          alignItems="center"
          justifyContent={["space-between", "flex-end"]}
          overflow="hidden"
          pl={4}
          textAlign="left"
          textOverflow="ellipsis"
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
          <IconButton
            icon={<Icon icon={faChevronDown} />}
            ml={8}
            onClick={handleHidePlayer}
            title="Hide player (will stop audio)"
            variant="ghost"
          />
        </Flex>
      </Flex>
    </Box>
  );
};

export default Player;
