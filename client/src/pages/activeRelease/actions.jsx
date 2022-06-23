import { addToFavourites, removeFromFavourites, addToWishList, removeFromWishList } from "state/user";
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
  useColorModeValue
} from "@chakra-ui/react";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import { faHeart as heartOutline } from "@fortawesome/free-regular-svg-icons";
import { faHeart, faMagic, faMinusCircle } from "@fortawesome/free-solid-svg-icons";
import Icon from "components/icon";
import { toastInfo } from "state/toast";
import { useEffect, useState } from "react";

const Actions = () => {
  const dispatch = useDispatch();
  const [note, setNote] = useState("");
  const [isSavingToFaves, setIsSavingToFaves] = useState(false);
  const [isSavingToList, setIsSavingToList] = useState(false);
  const { account, favourites, wishList } = useSelector(state => state.user, shallowEqual);
  const release = useSelector(state => state.releases.activeRelease, shallowEqual);
  const releaseId = release._id;
  const isInFaves = favourites?.some(item => item.release === releaseId);
  const isInWishList = wishList?.some(item => item.release === releaseId);

  useEffect(() => {
    if (wishList.length && releaseId) {
      const { note } = wishList?.find(item => item.release === releaseId) || {};
      if (note) setNote(note);
    }
  }, [releaseId, wishList]);

  return (
    <ButtonGroup size="sm" isAttached variant="outline" bg={useColorModeValue("white")} mb={4}>
      <Button
        isLoading={isSavingToFaves}
        loadingText="Saving…"
        leftIcon={<Icon color={isInFaves && "red.400"} icon={isInFaves ? faHeart : heartOutline} />}
        onClick={() => {
          if (!account)
            return dispatch(
              toastInfo({
                message: "You need to be logged in to save this track to your favourites.",
                title: "Please log in"
              })
            );
          if (isInFaves) return dispatch(removeFromFavourites(releaseId));
          setIsSavingToFaves(true);
          dispatch(addToFavourites(releaseId)).then(() => setIsSavingToFaves(false));
        }}
        title="Save to favourites."
        mr="-px"
        flex={1}
      >
        Fave
      </Button>
      <Popover>
        <PopoverTrigger>
          <Button leftIcon={<Icon color={isInWishList && "purple.400"} icon={faMagic} />} flex={1}>
            List
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
              onKeyDown={({ key }) => {
                if (key === "Enter") {
                  setIsSavingToList(true);
                  dispatch(addToWishList({ releaseId, note })).then(() => setIsSavingToList(false));
                }
              }}
              value={note}
              mb={2}
            />
          </PopoverBody>
          <PopoverFooter display="flex" justifyContent="space-between">
            <Button
              colorScheme="red"
              isDisabled={!isInWishList}
              leftIcon={<Icon icon={faMinusCircle} />}
              onClick={() => dispatch(removeFromWishList(releaseId))}
              title="Remove from wish list."
              variant="ghost"
            >
              Remove
            </Button>
            <Button
              isLoading={isSavingToList}
              loadingText="Saving…"
              leftIcon={<Icon icon={faMagic} />}
              onClick={() => {
                if (!account) {
                  return dispatch(
                    toastInfo({
                      message: "You need to be logged in to save this track to your wish list.",
                      title: "Please log in"
                    })
                  );
                }

                setIsSavingToList(true);
                dispatch(addToWishList({ releaseId, note })).then(() => setIsSavingToList(false));
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
