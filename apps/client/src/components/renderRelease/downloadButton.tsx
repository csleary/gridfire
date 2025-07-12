import {
  Box,
  Button,
  Divider,
  IconButton,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  useColorModeValue
} from "@chakra-ui/react";
import { faCloudDownloadAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";

import DownloadModal from "@/components/renderRelease/downloadModal";

interface Props {
  artistName: string;
  purchaseId: string;
  releaseId: string;
  releaseTitle: string;
}

const OverlayDownloadButton = ({ artistName, purchaseId, releaseId, releaseTitle }: Props) => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <IconButton
        _hover={{ color: "#fff" }}
        alignItems="center"
        aria-label="Download release"
        color="hsla(233, 10%, 75%, 1)"
        display="flex"
        flex="1 1 100%"
        fontSize="5rem"
        height="unset"
        icon={
          <Box
            _groupHover={{ transform: "scale(1.2)" }}
            as={FontAwesomeIcon}
            icon={faCloudDownloadAlt}
            transition="0.25s cubic-bezier(0.2, 0.8, 0.4, 1)"
          />
        }
        justifyContent="center"
        onClick={() => setShowModal(true)}
        p="0"
        role="group"
        title={`Download ${artistName} - '${releaseTitle}'`}
        variant="unstyled"
      />
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} size="4xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader fontSize="4xl" fontWeight={300} textAlign="center">
            Download{" "}
            <Box as="span" fontStyle="italic">
              {releaseTitle}
            </Box>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody px={8} py={0}>
            <Divider borderColor={useColorModeValue("gray.200", "gray.500")} mb={8} />
            <DownloadModal
              artistName={artistName}
              purchaseId={purchaseId}
              releaseId={releaseId}
              releaseTitle={releaseTitle}
            />
            <Divider borderColor={useColorModeValue("gray.200", "gray.500")} mt={8} />
          </ModalBody>
          <ModalFooter p={8}>
            <Button onClick={() => setShowModal(false)}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default OverlayDownloadButton;
