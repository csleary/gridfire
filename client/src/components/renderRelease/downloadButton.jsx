import {
  Button,
  Box,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
  ModalFooter
} from "@chakra-ui/react";
import DownloadModal from "components/renderRelease/downloadModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import PropTypes from "prop-types";
import { faCloudDownloadAlt } from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";

const OverlayDownloadButton = ({ artistName, releaseId, releaseTitle }) => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <IconButton
        alignItems="center"
        color="hsla(233, 10%, 75%, 1)"
        display="flex"
        flex="1"
        fontSize="5rem"
        height="unset"
        justifyContent="center"
        icon={
          <Box
            as={FontAwesomeIcon}
            icon={faCloudDownloadAlt}
            transition="0.25s cubic-bezier(0.2, 0.8, 0.4, 1)"
            _groupHover={{ transform: "scale(1.2)" }}
          />
        }
        onClick={() => setShowModal(true)}
        p="0"
        role="group"
        title={`Download ${artistName} - \u2018${releaseTitle}\u2019`}
        variant="unstyled"
        _hover={{ color: "#fff" }}
      />
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalBody>
            <DownloadModal artistName={artistName} releaseId={releaseId} releaseTitle={releaseTitle} />
          </ModalBody>
          <ModalFooter>
            <Button onClick={() => setShowModal(false)}>Close</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

OverlayDownloadButton.propTypes = {
  artistName: PropTypes.string,
  releaseId: PropTypes.string,
  releaseTitle: PropTypes.string
};

export default OverlayDownloadButton;
