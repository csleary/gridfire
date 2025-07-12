import {
  Box,
  Button,
  ButtonGroup,
  Input,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverFooter,
  PopoverHeader,
  PopoverTrigger,
  Skeleton,
  useColorModeValue,
  useDisclosure
} from "@chakra-ui/react";
import { faHeart as heartOutline } from "@fortawesome/free-regular-svg-icons";
import { faHeart, faMagic, faMinusCircle } from "@fortawesome/free-solid-svg-icons";
import { UserListItem } from "@gridfire/shared/types";
import { useEffect, useState } from "react";
import { shallowEqual } from "react-redux";

import Icon from "@/components/icon";
import { useDispatch, useSelector } from "@/hooks";
import { toastInfo } from "@/state/toast";
import {
  addToFavourites,
  addToWishList,
  removeFromFavourites,
  removeFromWishList,
  selectIsInFavourites,
  selectIsInWishList
} from "@/state/user";

const Actions = () => {
  const buttonGroupBg = useColorModeValue("white", undefined);
  const { isOpen, onClose, onToggle } = useDisclosure();
  const dispatch = useDispatch();
  const [note, setNote] = useState("");
  const [isSavingToFaves, setIsSavingToFaves] = useState(false);
  const [isSavingToList, setIsSavingToList] = useState(false);
  const account = useSelector(state => state.user.account);
  const isLoading = useSelector(state => state.releases.isLoading);
  const releaseId = useSelector(state => state.releases.activeRelease._id);
  const wishList = useSelector(state => state.user.wishList, shallowEqual);
  const isInFaves = useSelector(selectIsInFavourites(releaseId));
  const isInWishList = useSelector(selectIsInWishList(releaseId));

  useEffect(() => {
    if (wishList.length && releaseId) {
      const { note = "" } = wishList.find(({ release }: UserListItem) => release === releaseId) || { note: "" };
      if (note) setNote(note);
    }
  }, [releaseId, wishList]);

  if (isLoading) {
    return (
      <Skeleton>
        <ButtonGroup bg={buttonGroupBg} isAttached mb={0} size="sm" variant="outline">
          <Button />
        </ButtonGroup>
      </Skeleton>
    );
  }

  return (
    <ButtonGroup bg={buttonGroupBg} isAttached size="sm" variant="outline">
      <Button
        flex={1}
        isLoading={isSavingToFaves}
        leftIcon={<Icon color={isInFaves ? "red.400" : undefined} icon={isInFaves ? faHeart : heartOutline} />}
        loadingText="Saving…"
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
      >
        Like
      </Button>
      <Popover isOpen={isOpen} onClose={onClose}>
        <PopoverTrigger>
          <Button
            flex={1}
            leftIcon={<Icon color={isInWishList ? "purple.400" : undefined} icon={faMagic} />}
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
            <Box as="label" display="inline-block" htmlFor="note" mb={2}>
              Enter an optional note for this release (private, just for your own reference):
            </Box>
            <Input
              id="note"
              mb={2}
              name="note"
              onChange={e => setNote(e.target.value)}
              onKeyDown={async ({ key }) => {
                if (key === "Enter") {
                  setIsSavingToList(true);
                  await dispatch(addToWishList({ note, releaseId }));
                  setIsSavingToList(false);
                  onClose();
                }
              }}
              value={note}
              variant="modal"
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
              leftIcon={<Icon icon={faMagic} />}
              loadingText="Saving…"
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
                dispatch(addToWishList({ note, releaseId }));
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
