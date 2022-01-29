import { Box, Button, ButtonGroup, Divider, Flex, Text } from "@chakra-ui/react";
import { deleteRelease, publishStatus } from "features/releases";
import { faCircle, faHeart, faPencilAlt, faPlay } from "@fortawesome/free-solid-svg-icons";
import { faEye, faEyeSlash, faTrashAlt } from "@fortawesome/free-regular-svg-icons";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import { toastSuccess, toastWarning } from "features/toast";
import Artwork from "./artwork";
import Icon from "components/icon";
import PropTypes from "prop-types";
import StatusIcon from "./statusIcon";
import Title from "./title";
import moment from "moment";
import { setReleaseIdsForDeletion } from "features/releases";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

function UserRelease({ favs, numSold, plays, release }) {
  const {
    _id: releaseId,
    artist,
    artistName,
    artwork,
    price,
    published,
    releaseDate,
    releaseTitle,
    trackList
  } = release;

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { releaseIdsForDeletion } = useSelector(state => state.releases, shallowEqual);
  const [isPublishingRelease, setPublishingRelease] = useState(false);

  const cancelDeleteTrack = id => {
    dispatch(setReleaseIdsForDeletion({ releaseId: id, isDeleting: false }));
  };

  const handleDeleteRelease = () => {
    const releaseName = releaseTitle ? `\u2018${releaseTitle}\u2019` : "release";
    dispatch(deleteRelease(releaseId, releaseName));
  };

  const handlePublishStatus = async () => {
    setPublishingRelease(true);
    const success = await dispatch(publishStatus(releaseId));
    if (success && published)
      dispatch(toastWarning({ message: `\u2018${releaseTitle}\u2019 has been taken offline.`, title: "Note" }));
    else if (success)
      dispatch(toastSuccess({ message: `\u2018${releaseTitle}\u2019 is now live and on sale.`, title: "Published!" }));
    setPublishingRelease(false);
  };

  const hasAudio = !trackList.length || trackList.some(el => el?.status !== "stored") ? false : true;

  return (
    <Flex
      as="li"
      flexDirection="column"
      key={releaseId}
      bg="white"
      borderWidth="1px"
      boxShadow="md"
      position="relative"
    >
      <Artwork artwork={artwork} releaseId={releaseId} releaseTitle={releaseTitle} />
      <StatusIcon published={published} releaseTitle={releaseTitle} />
      <Title artist={artist} artistName={artistName} favs={favs} releaseId={releaseId} releaseTitle={releaseTitle} />
      <Divider my={2} />
      <Flex flexDirection="column" px={4} pt={2} pb={4}>
        <Flex marginTop="auto">
          <Box flex={1} pr={2}>
            <Text>
              <Icon color={price > 0 ? "green.200" : "orange.300"} fixedWidth icon={faCircle} mr={2} />
              {price > 0 ? `$${price} USD` : "Name your price"}
            </Text>
            <Text>
              <Icon
                color={new Date(releaseDate) - Date.now() > 0 ? "orange.300" : "green.200"}
                fixedWidth
                icon={faCircle}
                mr={2}
              />
              {moment(new Date(releaseDate)).format("Do of MMM, YYYY")}
            </Text>
            <Text>
              <Icon color={hasAudio ? "green.200" : "red.400"} fixedWidth icon={faCircle} mr={2} />
              {trackList.length} track{trackList.length === 1 ? "" : "s"}
              {trackList.length && !hasAudio ? " (incomplete)" : null}
            </Text>
            <Text>
              <Icon
                color={numSold ? "green.200" : "gray.500"}
                fixedWidth
                icon={faCircle}
                title="Number of copies sold."
                mr={2}
              />
              {numSold} sold
            </Text>
          </Box>
          <Box>
            <Text title="Total plays for this release.">
              {plays}
              <Icon color={plays > 0 ? "green.200" : "gray.500"} fixedWidth icon={faPlay} ml={2} />
            </Text>
            <Text title="Total favourites for this release.">
              {favs}
              <Icon color={favs > 0 ? "red.400" : "gray.500"} fixedWidth icon={faHeart} ml={2} />
            </Text>
          </Box>
        </Flex>
        <ButtonGroup isAttached mt={4}>
          <Button
            flex={1}
            leftIcon={<Icon icon={faPencilAlt} />}
            onClick={() => navigate(`/release/${releaseId}/edit`)}
            mr="-px"
            size="sm"
          >
            Edit
          </Button>
          <Button
            flex={1}
            leftIcon={<Icon icon={published ? faEyeSlash : faEye} />}
            isLoading={isPublishingRelease}
            loadingText="Publishing…"
            onClick={handlePublishStatus}
            mr="-px"
            size="sm"
          >
            {published ? "Unpublish" : "Publish"}
          </Button>
          <Button
            colorScheme={releaseIdsForDeletion[releaseId] ? "red" : "gray"}
            flex={1}
            leftIcon={<Icon icon={faTrashAlt} />}
            onBlur={() => cancelDeleteTrack(releaseId)}
            onClick={handleDeleteRelease}
            onKeyDown={({ key }) => (key === "Escape") & cancelDeleteTrack(releaseId)}
            size="sm"
          >
            {releaseIdsForDeletion[releaseId] ? "Confirm!" : "Delete"}
          </Button>
        </ButtonGroup>
      </Flex>
    </Flex>
  );
}

UserRelease.propTypes = {
  favs: PropTypes.number,
  numSold: PropTypes.number,
  plays: PropTypes.number,
  release: PropTypes.object
};

export default UserRelease;
