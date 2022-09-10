import { Flex, Text, useBreakpointValue } from "@chakra-ui/react";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import PlayerButton from "./playerButton";
import { faEllipsis } from "@fortawesome/free-solid-svg-icons";

interface Props {
  artistName: string;
  releaseId: string;
  trackTitle: string;
}

const TrackInfo = ({ artistName, releaseId, trackTitle }: Props) => {
  const isSmallScreen = useBreakpointValue({ base: true, sm: false });
  const { pathname } = useLocation();
  const navigate = useNavigate();

  if (isSmallScreen)
    return (
      <PlayerButton
        ariaLabel="Visit the release page for this track."
        icon={faEllipsis}
        onClick={() => navigate(`/release/${releaseId}`)}
        mr={2}
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
