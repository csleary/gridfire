import { Flex, Text, useMediaQuery } from "@chakra-ui/react";
import { faEllipsis } from "@fortawesome/free-solid-svg-icons";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";

import PlayerButton from "./playerButton";

interface Props {
  artistName: string;
  releaseId: string;
  trackTitle: string;
}

const TrackInfo = ({ artistName, releaseId, trackTitle }: Props) => {
  const [isSmallScreen] = useMediaQuery([
    "(max-device-width: 736px)",
    "(-webkit-min-device-pixel-ratio: 2)",
    "(screen)"
  ]);

  const { pathname } = useLocation();
  const navigate = useNavigate();

  if (isSmallScreen)
    return (
      <PlayerButton
        ariaLabel="Visit the release page for this track."
        icon={faEllipsis}
        mr={2}
        onClick={() => navigate(`/release/${releaseId}`)}
      />
    );

  return (
    <Flex
      alignItems="center"
      flex="1 1 50%"
      overflow="hidden"
      pl={[1, 4]}
      textAlign="left"
      textOverflow="ellipsis"
      whiteSpace="nowrap"
    >
      {pathname === `/release/${releaseId}` ? (
        <Text>
          {artistName} &bull; <Text as="em">{trackTitle}</Text>
        </Text>
      ) : (
        <Text as={RouterLink} to={`/release/${releaseId}`}>
          {artistName} &bull; <Text as="em">{trackTitle}</Text>
        </Text>
      )}
    </Flex>
  );
};

export default TrackInfo;
