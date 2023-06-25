import { Box, Flex, Link, useColorModeValue } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { shallowEqual } from "react-redux";
import { useSelector } from "hooks";

interface Props {
  artist: string;
  artistName: string;
  releaseId: string;
  releaseTitle: string;
}

const Title = ({ artist, artistName, releaseId, releaseTitle }: Props) => {
  const { artists } = useSelector(state => state.artists, shallowEqual);
  const slug = artists.find(a => a._id === artist)?.slug;

  return (
    <Flex
      fontSize="xl"
      alignItems="center"
      color={useColorModeValue("gray.600", "gray.200")}
      flex={1}
      fontWeight={500}
      justifyContent="center"
      px={4}
      pt={2}
      pb={0}
      textAlign="center"
    >
      <Box overflow="hidden" textOverflow="ellipsis">
        <Link as={RouterLink} to={`/artist/${slug ? slug : artist}`} whiteSpace="nowrap" title={artistName}>
          {artistName || "?"}
        </Link>
        <Box as="span" mx={4}>
          &bull;
        </Box>
        <Link as={RouterLink} to={`/release/${releaseId}`} fontStyle="italic" whiteSpace="nowrap" title={releaseTitle}>
          {releaseTitle || "Untitled Release"}
        </Link>
      </Box>
    </Flex>
  );
};

export default Title;
