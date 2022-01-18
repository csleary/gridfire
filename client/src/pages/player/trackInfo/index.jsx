import { Link as RouterLink, useLocation } from "react-router-dom";
import { Link, Text } from "@chakra-ui/react";
import { shallowEqual, useSelector } from "react-redux";
import PropTypes from "prop-types";

const TrackInfo = ({ isReady }) => {
  const location = useLocation();
  const { releaseId, artistName, trackTitle } = useSelector(state => state.player, shallowEqual);
  if (!isReady) return <Text>Loading&hellip;</Text>;

  if (location.pathname !== `/release/${releaseId}`) {
    return (
      <Link as={RouterLink} to={`/release/${releaseId}`}>
        <Text>
          {artistName} &bull; <Text as="em">{trackTitle}</Text>
        </Text>
      </Link>
    );
  }

  return (
    <Text>
      {artistName} &bull; <Text as="em">{trackTitle}</Text>
    </Text>
  );
};

TrackInfo.propTypes = {
  isReady: PropTypes.bool
};

export default TrackInfo;
