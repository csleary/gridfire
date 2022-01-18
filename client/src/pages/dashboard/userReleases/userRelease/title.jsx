import { Box, Flex, Link } from "@chakra-ui/react";
import { shallowEqual, useSelector } from "react-redux";
import { Link as RouterLink } from "react-router-dom";
import PropTypes from "prop-types";

const Title = ({ artist, artistName, releaseId, releaseTitle }) => {
  const { artists } = useSelector(state => state.artists, shallowEqual);
  const slug = artists.find(a => a._id === artist)?.slug;

  return (
    <Flex
      fontSize="xl"
      alignItems="center"
      color="gray.600"
      flex={1}
      fontWeight={500}
      justifyContent="center"
      px={4}
      py={2}
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

Title.propTypes = {
  artist: PropTypes.string,
  artistName: PropTypes.string,
  releaseId: PropTypes.string,
  releaseTitle: PropTypes.string
};

export default Title;
