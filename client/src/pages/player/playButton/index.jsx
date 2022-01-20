import { faCog, faPause, faPlay } from "@fortawesome/free-solid-svg-icons";
import { shallowEqual, useSelector } from "react-redux";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import PropTypes from "prop-types";
import styles from "./playButton.module.css";

const PlayButton = ({ isReady, onClick }) => {
  const { isPlaying } = useSelector(state => state.player, shallowEqual);

  if (!isReady) {
    return <FontAwesomeIcon icon={faCog} className={`${styles.playerButton} ${styles.waiting}`} fixedWidth spin />;
  }

  if (isPlaying) {
    return <FontAwesomeIcon icon={faPause} className={styles.playerButton} fixedWidth onClick={onClick} />;
  }

  return <FontAwesomeIcon icon={faPlay} className={styles.playerButton} fixedWidth onClick={onClick} />;
};

PlayButton.propTypes = {
  isReady: PropTypes.bool,
  onClick: PropTypes.func,
  playAudio: PropTypes.func
};

export default PlayButton;
