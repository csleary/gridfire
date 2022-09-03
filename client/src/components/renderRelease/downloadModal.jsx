import { Box, Button, Heading, Image, Link, Wrap, VStack, WrapItem } from "@chakra-ui/react";
import { CLOUD_URL } from "index";
import Icon from "components/icon";
import PropTypes from "prop-types";
import { faCloudDownloadAlt } from "@fortawesome/free-solid-svg-icons";
import placeholder from "placeholder.svg";

const DownloadModal = ({ artistName, artworkCID, purchaseId, releaseTitle }) => {
  return (
    <>
      <Heading>
        Download{" "}
        <Box as="span" fontStyle="italic">
          {releaseTitle}
        </Box>
      </Heading>
      <Wrap as="section" mb={4}>
        <WrapItem flex="1 1 24ch">
          <Image
            alt={`${artistName} - ${releaseTitle}`}
            className="lazyload"
            fallbackSrc={placeholder}
            src={`${CLOUD_URL}/${artworkCID}`}
          />
        </WrapItem>
        <WrapItem alignItems="stretch" flex="1 1 24ch" p={4}>
          <VStack flex="1" justifyContent="center" spacing={12}>
            <Box>
              <Button
                as={Link}
                download={`${artistName} - ${releaseTitle}.zip`}
                href={`/api/download/${purchaseId}/mp3`}
                leftIcon={<Icon icon={faCloudDownloadAlt} />}
                mb="1"
                size="lg"
              >
                Download MP3
              </Button>
            </Box>
            <Box>
              <Button
                as={Link}
                download={`${artistName} - ${releaseTitle}.zip`}
                href={`/api/download/${purchaseId}/flac`}
                leftIcon={<Icon icon={faCloudDownloadAlt} />}
                mb="1"
                size="lg"
              >
                Download FLAC
              </Button>
            </Box>
          </VStack>
        </WrapItem>
      </Wrap>
    </>
  );
};

DownloadModal.propTypes = {
  artistName: PropTypes.string,
  releaseId: PropTypes.string,
  releaseTitle: PropTypes.string
};

export default DownloadModal;
