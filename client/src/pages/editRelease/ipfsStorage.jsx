import { Box, Button, Flex, Fade, Text, VStack, useClipboard, useColorModeValue } from "@chakra-ui/react";
import { shallowEqual, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import Icon from "components/icon";
import axios from "axios";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCopy } from "@fortawesome/free-regular-svg-icons";

const CID = ({ cid }) => {
  const { hasCopied, onCopy } = useClipboard(cid);

  return (
    <Flex alignItems="center" display="inline-flex">
      <Text
        onClick={onCopy}
        bg={useColorModeValue("gray.600", "gray.700")}
        borderRadius="md"
        color={useColorModeValue("gray.100", "gray.400")}
        cursor="pointer"
        fontFamily="monospace"
        fontSize="lg"
        mr={2}
        px={1}
        _hover={{ color: "gray.300" }}
      >
        {cid}
      </Text>
      <Fade in={hasCopied} unmountOnExit>
        <Box as="span" bg="purple.300" color="purple.800" fontWeight="500" fontSize="sm" px={1} borderRadius="md">
          <Icon icon={faCheck} mr={1} />
          Copied!
        </Box>
      </Fade>
    </Flex>
  );
};

const IpfsStorage = () => {
  const { _id: releaseId } = useSelector(state => state.releases.activeRelease, shallowEqual);
  const [{ artwork = {}, trackList = [] }, setCids] = useState({});
  const headingColor = useColorModeValue("gray.700", "gray.300");
  const fileColor = useColorModeValue("gray.600", "gray.400");

  const { hasCopied, onCopy } = useClipboard(
    [artwork.cid, ...trackList.flatMap(({ cids }) => Object.values(cids))].join("\n")
  );

  useEffect(() => {
    if (releaseId) {
      try {
        axios(`/api/release/${releaseId}/ipfs`).then(res => setCids(res.data));
      } catch (error) {}
    }
  }, [releaseId]);

  return (
    <>
      <Text mb={4}>
        Help us by pinning your own release files on an IPFS node.
        <br /> Click on a single CID to copy it to the clipboard, or copy the whole list using the button below.
      </Text>
      <Button mb={8} onClick={onCopy} leftIcon={<FontAwesomeIcon icon={faCopy} />}>
        {hasCopied ? "Copied!" : "Copy all"}
      </Button>
      <VStack alignItems="stretch">
        <Box color={headingColor} mb={2} fontWeight={500} mr={2}>
          Artwork: <CID cid={artwork.cid} />
        </Box>
        <Box>Tracks:</Box>

        {trackList.map(({ _id, cids, trackTitle }, index) => {
          const { src, flac, mp4, mp3 } = cids;
          return (
            <Box key={_id} mb={4}>
              <Box color={headingColor} mb={2} fontWeight={500}>
                {`${index + 1}`.padStart(2, "0")}. {trackTitle}:<br />
              </Box>
              <Box as="span" color={fileColor} mr={2}>
                Source:
              </Box>
              <CID cid={src} />
              <br />
              <Box as="span" color={fileColor} mr={2}>
                FLAC:
              </Box>
              <CID cid={flac} />
              <br />
              <Box as="span" color={fileColor} mr={2}>
                AAC:
              </Box>
              <CID cid={mp4} />
              <br />
              <Box as="span" color={fileColor} mr={2}>
                MP3:
              </Box>
              <CID cid={mp3} />
              <br />
            </Box>
          );
        })}
      </VStack>
    </>
  );
};

export default IpfsStorage;
