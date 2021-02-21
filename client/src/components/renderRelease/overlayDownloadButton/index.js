import React, { useState } from 'react';
import DownloadModal from 'components/downloadModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Modal from 'components/modal';
import PropTypes from 'prop-types';
import { faCloudDownloadAlt } from '@fortawesome/free-solid-svg-icons';
import styles from '../renderRelease.module.css';

const OverlayDownloadButton = ({ artistName, releaseId, releaseTitle }) => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        className={styles.download}
        onClick={() => setShowModal(true)}
        title={`Download ${artistName} - \u2018${releaseTitle}\u2019`}
      >
        <FontAwesomeIcon className={styles.icon} icon={faCloudDownloadAlt} />
      </button>
      <Modal closeModal={() => setShowModal(false)} isOpen={showModal}>
        <DownloadModal artistName={artistName} releaseId={releaseId} releaseTitle={releaseTitle} />
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
