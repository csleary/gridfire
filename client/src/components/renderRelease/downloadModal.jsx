import { Box, Button, Heading, Image, Flex, Text, Wrap, WrapItem, VStack, Link } from "@chakra-ui/react";
import { CLOUD_URL } from "index";
import Icon from "components/icon";
import PropTypes from "prop-types";
import { faCloudDownloadAlt } from "@fortawesome/free-solid-svg-icons";
import placeholder from "placeholder.svg";
import { useDownload } from "hooks/useDownload";

const DownloadModal = ({ artistName, releaseId, releaseTitle }) => {
  const { anchorRef, downloadUrl, handleDownload, isPreparingDownload } = useDownload({
    artistName,
    releaseId,
    releaseTitle
  });

  return (
    <>
      <Heading>Download &lsquo;{releaseTitle}&rsquo;</Heading>
      <Wrap as="section" mb={4}>
        <WrapItem flex="1 1 24ch">
          <Image
            alt={`${artistName} - ${releaseTitle}`}
            className="lazyload"
            fallbackSrc={placeholder}
            src={`${CLOUD_URL}/${releaseId}.jpg`}
          />
        </WrapItem>
        <WrapItem alignItems="stretch" flex="1 1 24ch" p={4}>
          <VStack flex="1" justifyContent="center" spacing={8}>
            <Button leftIcon={<Icon icon={faCloudDownloadAlt} />} onClick={() => handleDownload("mp3")} size="lg">
              MP3
            </Button>
            <Button leftIcon={<Icon icon={faCloudDownloadAlt} />} onClick={() => handleDownload("flac")} size="lg">
              FLAC
            </Button>
          </VStack>
        </WrapItem>
      </Wrap>
      {isPreparingDownload ? (
        <Text>We are building your chosen format. Please stand by.</Text>
      ) : (
        <Text>Depending on your chosen format there might be some processing time before your download begins.</Text>
      )}
      <Link download href={downloadUrl} ref={ref => (anchorRef.current = ref)} style={{ display: "none" }}>
        Download
      </Link>
    </>
  );
};

DownloadModal.propTypes = {
  artistName: PropTypes.string,
  releaseId: PropTypes.string,
  releaseTitle: PropTypes.string
};

export default DownloadModal;
