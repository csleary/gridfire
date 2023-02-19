import { Box, Button, Image, Link, Wrap, VStack, WrapItem, Text, useColorModeValue } from "@chakra-ui/react";
import Icon from "components/icon";
import PropTypes from "prop-types";
import { faCloudDownloadAlt } from "@fortawesome/free-solid-svg-icons";
import placeholder from "placeholder.svg";

const { REACT_APP_CDN_IMG } = process.env;

const DownloadModal = ({ artistName, purchaseId, releaseId, releaseTitle }) => {
  const primaryButtonColor = useColorModeValue("yellow", "purple");

  return (
    <>
      <Wrap as="section" mb={4} spacing={8}>
        <WrapItem flex="1 1 24rem">
          <Image
            alt={`${artistName} - ${releaseTitle}`}
            className="lazyload"
            fallbackSrc={placeholder}
            src={`${REACT_APP_CDN_IMG}/${releaseId}`}
          />
        </WrapItem>
        <WrapItem alignItems="stretch" flex="1 1 24rem">
          <VStack flex="1" justifyContent="space-between" spacing={12}>
            <Text>Choose your preferred audio format. All formats will be delivered as a zip file, with artwork.</Text>
            <Box>
              <Button
                as={Link}
                colorScheme={primaryButtonColor}
                download={`${artistName} - ${releaseTitle}.zip`}
                href={`/api/download/${purchaseId}/mp3`}
                leftIcon={<Icon icon={faCloudDownloadAlt} />}
                mb="1"
                size="lg"
              >
                MP3
              </Button>
            </Box>
            <Box>
              <Button
                as={Link}
                colorScheme={primaryButtonColor}
                download={`${artistName} - ${releaseTitle}.zip`}
                href={`/api/download/${purchaseId}/flac`}
                leftIcon={<Icon icon={faCloudDownloadAlt} />}
                mb="1"
                size="lg"
              >
                FLAC
              </Button>
            </Box>
            <Box />
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
