import Icon from "@/components/icon";
import { useDispatch, useSelector } from "@/hooks";
import { deleteRelease, publishStatus, setReleaseIdsForDeletion } from "@/state/releases";
import { toastSuccess, toastWarning } from "@/state/toast";
import { UserRelease as IUserRelease } from "@/types";
import { Box, Button, Divider, Flex, FormLabel, Stack, Switch, useColorModeValue } from "@chakra-ui/react";
import { faCalendar, faEye, faEyeSlash, faFileAudio, faTrashAlt } from "@fortawesome/free-regular-svg-icons";
import { faCashRegister, faDollarSign, faHeart, faPencilAlt, faPlay } from "@fortawesome/free-solid-svg-icons";
import { DateTime } from "luxon";
import { useState } from "react";
import { shallowEqual } from "react-redux";
import { useNavigate } from "react-router-dom";
import Artwork from "./artwork";
import StatusIcon from "./statusIcon";
import Title from "./title";

interface Props {
  release: IUserRelease;
}

function UserRelease({ release }: Props) {
  const {
    _id: releaseId,
    artist,
    artistName,
    artwork,
    faves,
    plays,
    price,
    published,
    releaseDate,
    releaseTitle,
    sales = 0,
    trackList
  } = release;

  const iconColor = useColorModeValue("green.400", "green.200");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const releaseIdsForDeletion = useSelector(state => state.releases.releaseIdsForDeletion, shallowEqual);
  const [isPublishingRelease, setPublishingRelease] = useState(false);

  const cancelDeleteTrack = (id: string) => {
    dispatch(setReleaseIdsForDeletion({ releaseId: id, isDeleting: false }));
  };

  const handleDeleteRelease = () => {
    const releaseName = releaseTitle ? `'${releaseTitle}'` : "release";
    dispatch(deleteRelease(releaseId, releaseName));
  };

  const handlePublishStatus = async () => {
    setPublishingRelease(true);
    const success = await dispatch(publishStatus(releaseId));
    if (success && published)
      dispatch(toastWarning({ message: `'${releaseTitle}' has been taken offline.`, title: "Note" }));
    else if (success)
      dispatch(toastSuccess({ message: `'${releaseTitle}' is now live and on sale.`, title: "Published!" }));
    setPublishingRelease(false);
  };

  const hasAudio = !trackList.length || !trackList.some(el => el?.status !== "stored");

  return (
    <Flex
      as="li"
      flexDirection="column"
      key={releaseId}
      bg={useColorModeValue("white", "gray.800")}
      borderColor={useColorModeValue("white", "gray.700")}
      borderWidth="1px"
      boxShadow="md"
      position="relative"
    >
      <Artwork artwork={artwork} releaseId={releaseId} releaseTitle={releaseTitle} />
      <StatusIcon published={published} releaseTitle={releaseTitle} />
      <Title artist={artist} artistName={artistName} releaseId={releaseId} releaseTitle={releaseTitle} />
      <Stack direction="column" spacing={4} p={4}>
        <Divider borderColor={useColorModeValue("gray.200", "gray.600")} />
        <Stack
          color={useColorModeValue("gray.600", "gray.400")}
          direction="row"
          fontWeight="500"
          justifyContent="space-between"
          marginTop="auto"
          spacing={4}
        >
          <Box flex="1 1 50%">
            <Box>
              <Icon color={Number(price) > 0 ? iconColor : "orange.300"} fixedWidth icon={faDollarSign} mr={2} />
              {Number(price) > 0 ? <>{price} DAI</> : "Name your price"}
            </Box>
            <Box>
              <Icon
                color={Date.parse(releaseDate) - Date.now() > 0 ? "orange.300" : iconColor}
                fixedWidth
                icon={faCalendar}
                mr={2}
              />
              {DateTime.fromISO(releaseDate).toLocaleString(DateTime.DATE_SHORT)}
            </Box>
            <Box>
              <Icon color={hasAudio ? iconColor : "red.400"} fixedWidth icon={faFileAudio} mr={2} />
              {trackList.length} track{trackList.length === 1 ? "" : "s"}
              {trackList.length && !hasAudio ? " (incomplete)" : null}
            </Box>
            <Box>
              <Icon
                color={sales > 0 ? iconColor : "gray.500"}
                fixedWidth
                icon={faCashRegister}
                title="Number of copies sold."
                mr={2}
              />
              {sales} sold
            </Box>
          </Box>
          <Box flex="1 1 50%">
            <Box>
              <Icon
                color={plays > 0 ? iconColor : "gray.500"}
                fixedWidth
                icon={faPlay}
                mr={2}
                title="Total plays for this release."
              />
              {plays} {plays === 1 ? "play" : "plays"}
            </Box>
            <Box>
              <Icon
                color={faves > 0 ? "red.400" : "gray.500"}
                fixedWidth
                icon={faHeart}
                mr={2}
                title="Total likes for this release."
              />
              {faves} {faves === 1 ? "like" : "likes"}
            </Box>
            <Flex alignItems="center" justifyContent="space-between">
              <FormLabel htmlFor={`${releaseId}-published`} m={0}>
                <Icon
                  color={published ? iconColor : "orange.300"}
                  fixedWidth
                  icon={published ? faEye : faEyeSlash}
                  mr={2}
                />
                <Box as="span" mr={2}>
                  Published
                </Box>
              </FormLabel>
              <Switch
                colorScheme="green"
                isChecked={published}
                isDisabled={isPublishingRelease}
                id={`${releaseId}-published`}
                onChange={handlePublishStatus}
              />
            </Flex>
          </Box>
        </Stack>
        <Divider borderColor={useColorModeValue("gray.200", "gray.600")} />
        <Stack direction="row" justifyContent="space-between" spacing={4}>
          <Button
            leftIcon={<Icon icon={faPencilAlt} />}
            onClick={() => navigate(`/release/${releaseId}/edit`)}
            mr="-px"
            size="sm"
          >
            Edit
          </Button>
          <Button
            colorScheme="red"
            leftIcon={<Icon icon={faTrashAlt} />}
            onBlur={() => cancelDeleteTrack(releaseId)}
            onClick={handleDeleteRelease}
            onKeyDown={({ key }) => key === "Escape" && cancelDeleteTrack(releaseId)}
            size="sm"
            variant={releaseIdsForDeletion[releaseId] ? undefined : "ghost"}
          >
            {releaseIdsForDeletion[releaseId] ? "Confirm!" : "Delete"}
          </Button>
        </Stack>
      </Stack>
    </Flex>
  );
}

export default UserRelease;
