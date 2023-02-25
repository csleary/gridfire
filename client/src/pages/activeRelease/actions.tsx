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
import { addToFavourites, removeFromFavourites, addToWishList, removeFromWishList } from "state/user";
import { faHeart, faMagic, faMinusCircle } from "@fortawesome/free-solid-svg-icons";
import { useDispatch, useSelector } from "hooks";
import { useEffect, useState } from "react";
import Icon from "components/icon";
import { ListItem } from "types";
import { faHeart as heartOutline } from "@fortawesome/free-regular-svg-icons";
import { shallowEqual } from "react-redux";
import { toastInfo } from "state/toast";

const Actions = () => {
  const dispatch = useDispatch();
  const [note, setNote] = useState("");
  const [isSavingToFaves, setIsSavingToFaves] = useState(false);
  const [isSavingToList, setIsSavingToList] = useState(false);
  const { userFavourites, userWishList } = useSelector(state => state.releases, shallowEqual);
  const { account } = useSelector(state => state.user, shallowEqual);
  const release = useSelector(state => state.releases.activeRelease, shallowEqual);
  const { _id: releaseId } = release;
  const isInFaves = userFavourites.some(({ release }: ListItem) => release._id === releaseId);
  const isInWishList = userWishList.some(({ release }: ListItem) => release._id === releaseId);

  useEffect(() => {
    if (userWishList.length && releaseId) {
      const { note = "" } = userWishList.find(({ release }: ListItem) => release._id === releaseId) || { note: "" };
      if (note) setNote(note);
    }
  }, [releaseId, userWishList]);

  return (
    <ButtonGroup size="sm" isAttached variant="outline" bg={useColorModeValue("white", undefined)} mb={4}>
      <Button
        isLoading={isSavingToFaves}
        loadingText="Saving…"
        leftIcon={<Icon color={isInFaves ? "red.400" : undefined} icon={isInFaves ? faHeart : heartOutline} />}
        onClick={() => {
          if (!account)
            return dispatch(
              toastInfo({
                message: "You need to be logged in to save this track to your favourites.",
                title: "Please log in"
              })
            );
          if (isInFaves) return void dispatch(removeFromFavourites(releaseId));
          setIsSavingToFaves(true);
          dispatch(addToFavourites(releaseId)).then(() => setIsSavingToFaves(false));
        }}
        title="Save to favourites."
        mr="-px"
        flex={1}
      >
        Favourite
      </Button>
      <Popover>
        <PopoverTrigger>
          <Button leftIcon={<Icon color={isInWishList ? "purple.400" : undefined} icon={faMagic} />} flex={1}>
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
              onKeyDown={({ key }) => {
                if (key === "Enter") {
                  setIsSavingToList(true);
                  dispatch(addToWishList({ releaseId, note })).then(() => setIsSavingToList(false));
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
