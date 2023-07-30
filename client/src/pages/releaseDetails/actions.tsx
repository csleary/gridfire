import {
  Box,
  Button,
  ButtonGroup,
  Input,
  Popover,
  PopoverFooter,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
  PopoverCloseButton,
  PopoverHeader,
  PopoverBody,
  Skeleton,
  useColorModeValue,
  useDisclosure
} from "@chakra-ui/react";
import { addToFavourites, removeFromFavourites, addToWishList, removeFromWishList } from "state/user";
import { faHeart, faMagic, faMinusCircle } from "@fortawesome/free-solid-svg-icons";
import { useDispatch, useSelector } from "hooks";
import { useEffect, useState } from "react";
import Icon from "components/icon";
import { UserListItem } from "types";
import { faHeart as heartOutline } from "@fortawesome/free-regular-svg-icons";
import { shallowEqual } from "react-redux";
import { toastInfo } from "state/toast";

const Actions = () => {
  const buttonGroupBg = useColorModeValue("white", undefined);
  const { isOpen, onToggle, onClose } = useDisclosure();
  const dispatch = useDispatch();
  const [note, setNote] = useState("");
  const [isSavingToFaves, setIsSavingToFaves] = useState(false);
  const [isSavingToList, setIsSavingToList] = useState(false);
  const account = useSelector(state => state.user.account);
  const favourites = useSelector(state => state.user.favourites, shallowEqual);
  const isLoading = useSelector(state => state.releases.isLoading);
  const releaseId = useSelector(state => state.releases.activeRelease._id);
  const wishList = useSelector(state => state.user.wishList, shallowEqual);
  const isInFaves = favourites.some(({ release }: UserListItem) => release === releaseId); // TODO: use createSelector for this.
  const isInWishList = wishList.some(({ release }: UserListItem) => release === releaseId); // TODO: use createSelector for this.

  useEffect(() => {
    if (wishList.length && releaseId) {
      const { note = "" } = wishList.find(({ release }: UserListItem) => release === releaseId) || { note: "" };
      if (note) setNote(note);
    }
  }, [releaseId, wishList]);

  if (isLoading) {
    return (
      <Skeleton>
        <ButtonGroup size="sm" isAttached variant="outline" bg={buttonGroupBg} mb={0}>
          <Button />
        </ButtonGroup>
      </Skeleton>
    );
  }

  return (
    <ButtonGroup size="sm" isAttached variant="outline" bg={buttonGroupBg} mb={4}>
      <Button
        isLoading={isSavingToFaves}
        loadingText="Saving…"
        leftIcon={<Icon color={isInFaves ? "red.400" : undefined} icon={isInFaves ? faHeart : heartOutline} />}
        onClick={async () => {
          if (!account)
            return dispatch(
              toastInfo({
                message: "You need to be logged in to save this track to your favourites.",
                title: "Please log in"
              })
            );
          if (isInFaves) {
            dispatch(removeFromFavourites(releaseId));
            return;
          }
          setIsSavingToFaves(true);
          await dispatch(addToFavourites(releaseId));
          setIsSavingToFaves(false);
        }}
        title="Save to favourites."
        flex={1}
      >
        Like
      </Button>
      <Popover isOpen={isOpen} onClose={onClose}>
        <PopoverTrigger>
          <Button
            leftIcon={<Icon color={isInWishList ? "purple.400" : undefined} icon={faMagic} />}
            flex={1}
            onClick={onToggle}
          >
            Wish List
          </Button>
        </PopoverTrigger>
        <PopoverContent>
          <PopoverArrow />
          <PopoverCloseButton />
          <PopoverHeader>Add to wishlist…</PopoverHeader>
          <PopoverBody>
            <Box as="label" htmlFor="note" display="inline-block" mb={2}>
              Enter an optional note for this release (private, just for your own reference):
            </Box>
            <Input
              id="note"
              name="note"
              onChange={e => setNote(e.target.value)}
              onKeyDown={async ({ key }) => {
                if (key === "Enter") {
                  setIsSavingToList(true);
                  await dispatch(addToWishList({ releaseId, note }));
                  setIsSavingToList(false);
                  onClose();
                }
              }}
              value={note}
              variant="modal"
              mb={2}
            />
          </PopoverBody>
          <PopoverFooter display="flex" justifyContent="space-between">
            <Button
              colorScheme="red"
              isDisabled={!isInWishList}
              leftIcon={<Icon icon={faMinusCircle} />}
              onClick={() => {
                dispatch(removeFromWishList(releaseId));
                onClose();
                setNote("");
              }}
              title="Remove from wish list."
              variant="ghost"
            >
              Remove
            </Button>
            <Button
              isLoading={isSavingToList}
              loadingText="Saving…"
              leftIcon={<Icon icon={faMagic} />}
              onClick={async () => {
                if (!account) {
                  return void dispatch(
                    toastInfo({
                      message: "You need to be logged in to save this track to your wish list.",
                      title: "Please log in"
                    })
                  );
                }

                setIsSavingToList(true);
                dispatch(addToWishList({ releaseId, note }));
                setIsSavingToList(false);
                onClose();
              }}
              title="Save to wish list."
              variant="solid"
            >
              {isInWishList ? "Update" : "Save"}
            </Button>
          </PopoverFooter>
        </PopoverContent>
      </Popover>
    </ButtonGroup>
  );
};

export default Actions;
