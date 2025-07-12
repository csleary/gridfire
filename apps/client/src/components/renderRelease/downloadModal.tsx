import { Box, Button, Image, Link, Text, useColorModeValue, VStack, Wrap, WrapItem } from "@chakra-ui/react";
import { faCloudDownloadAlt } from "@fortawesome/free-solid-svg-icons";

import Icon from "@/components/icon";
import placeholder from "@/placeholder.svg";

const VITE_CDN_IMG = import.meta.env.VITE_CDN_IMG;

interface Props {
  artistName: string;
  purchaseId: string;
  releaseId: string;
  releaseTitle: string;
}

const DownloadModal = ({ artistName, purchaseId, releaseId, releaseTitle }: Props) => {
  const primaryButtonColor = useColorModeValue("yellow", "purple");

  return (
    <>
      <Wrap as="section" mb={4} spacing={8}>
        <WrapItem flex="1 1 24rem">
          <Image
            alt={`${artistName} - ${releaseTitle}`}
            className="lazyload"
            fallbackSrc={placeholder}
            src={`${VITE_CDN_IMG}/${releaseId}`}
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

export default DownloadModal;
