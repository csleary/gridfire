import {
  Box,
  Button,
  Fade,
  Image,
  Link,
  Text,
  useColorModeValue,
  useDisclosure,
  VStack,
  Wrap,
  WrapItem
} from "@chakra-ui/react";
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
  const { isOpen, onOpen } = useDisclosure();

  return (
    <>
      <Wrap as="section" mb={4} spacing={8}>
        <WrapItem flex="1 1 24rem">
          <Fade in={isOpen}>
            <Image
              alt={`${artistName} - ${releaseTitle}`}
              fallbackSrc={placeholder}
              loading="lazy"
              onLoad={onOpen}
              rel="preconnect"
              sizes={`(max-width: 992px) calc(100vw - 2rem), 400px`}
              src={`${VITE_CDN_IMG}/${releaseId}/1024w.webp`}
              srcSet={`${VITE_CDN_IMG}/${releaseId}/320w.webp 320w,
                       ${VITE_CDN_IMG}/${releaseId}/640w.webp 640w,
                       ${VITE_CDN_IMG}/${releaseId}/960w.webp 960w,
                       ${VITE_CDN_IMG}/${releaseId}/1024w.webp 1024w,
                       ${VITE_CDN_IMG}/${releaseId}/1440w.webp 1440w,
                       ${VITE_CDN_IMG}/${releaseId}/1920w.webp 1920w,
                       ${VITE_CDN_IMG}/${releaseId}/2560w.webp 2560w`}
            />
          </Fade>
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
