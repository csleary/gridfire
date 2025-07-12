import { Box, Flex, Link, useColorModeValue } from "@chakra-ui/react";
import { shallowEqual } from "react-redux";
import { Link as RouterLink } from "react-router-dom";

import { useSelector } from "@/hooks";

interface Props {
  artist: string;
  artistName: string;
  releaseId: string;
  releaseTitle: string;
}

const Title = ({ artist, artistName, releaseId, releaseTitle }: Props) => {
  const artists = useSelector(state => state.artists.artists, shallowEqual);
  const slug = artists.find(a => a._id === artist)?.slug;

  return (
    <Flex
      alignItems="center"
      color={useColorModeValue("gray.600", "gray.200")}
      flex={1}
      fontSize="xl"
      fontWeight={500}
      justifyContent="center"
      pb={0}
      pt={2}
      px={4}
      textAlign="center"
    >
      <Box overflow="hidden" textOverflow="ellipsis">
        <Link as={RouterLink} title={artistName} to={`/artist/${slug ? slug : artist}`} whiteSpace="nowrap">
          {artistName || "?"}
        </Link>
        <Box as="span" mx={4}>
          &bull;
        </Box>
        <Link as={RouterLink} fontStyle="italic" title={releaseTitle} to={`/release/${releaseId}`} whiteSpace="nowrap">
          {releaseTitle || "Untitled Release"}
        </Link>
      </Box>
    </Flex>
  );
};

export default Title;
