import Field from "@/components/field";
import Icon from "@/components/icon";
import { useDispatch, useSelector } from "@/hooks";
import { fetchArtists } from "@/state/artists";
import { updateRelease } from "@/state/editor";
import {
  Alert,
  Button,
  Flex,
  FormLabel,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  useColorModeValue
} from "@chakra-ui/react";
import { faChevronDown, faPlusCircle, faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import { ChangeEventHandler, MouseEventHandler, useEffect, useState } from "react";
import { shallowEqual } from "react-redux";

const ArtistMenu = () => {
  const errorAlertColor = useColorModeValue("red.800", "red.200");
  const dispatch = useDispatch();
  const artist = useSelector(state => state.editor.release.artist);
  const artistName = useSelector(state => state.editor.release.artistName);
  const artists = useSelector(state => state.artists.artists, shallowEqual);
  const isLoading = useSelector(state => state.artists.isLoading);
  const releaseErrors = useSelector(state => state.editor.releaseErrors, shallowEqual);
  const [showInput, setShowInput] = useState(false);
  const selectedArtist = artists?.find(({ _id: artistId }) => artist === artistId) || { name: "" };
  const defaultLabel = showInput ? "New artist" : "Select an artist…";
  type FieldEventHandler = ChangeEventHandler<HTMLInputElement & HTMLTextAreaElement>;

  useEffect(() => {
    dispatch(fetchArtists());
  }, [dispatch]);

  useEffect(() => {
    if (!isLoading && artists.length > 0) {
      setShowInput(false);
    } else {
      setShowInput(true);
    }
  }, [artists.length, isLoading]);

  const handleClick: MouseEventHandler<HTMLButtonElement> = e => {
    const { name, value } = e.currentTarget;
    dispatch(updateRelease({ name, value }));
    if (value === "") setShowInput(true);
  };

  const handleChange: FieldEventHandler = e => {
    const { checked, name, type, value } = e.currentTarget;
    dispatch(updateRelease({ checked, name, type, value }));
  };

  const handleBlur: ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement> = e => {
    const { value } = e.currentTarget;
    if (!value.trim() && artists.length > 0) {
      setShowInput(false);
    }
  };

  if (showInput) {
    return (
      <Field
        isDisabled={isLoading}
        error={releaseErrors.artistName}
        isRequired
        label={artists.length ? "New artist name" : "Artist name"}
        name="artistName"
        onBlur={handleBlur}
        onChange={handleChange}
        value={artistName}
        size="lg"
      />
    );
  }

  return (
    <Flex flexDirection="column" mb={6}>
      <FormLabel color="gray.500" fontWeight={500} mb={1}>
        Artist name
      </FormLabel>
      <Menu matchWidth>
        <MenuButton as={Button} rightIcon={<Icon fixedWidth icon={faChevronDown} />} height={12}>
          {showInput ? defaultLabel : selectedArtist?.name || defaultLabel}
        </MenuButton>
        <MenuList>
          {artists.map(({ _id: artistId, name }) => (
            <MenuItem key={artistId} name="artist" value={artistId} onClick={handleClick}>
              {name}
            </MenuItem>
          ))}
          {artists.length ? <MenuDivider /> : null}
          <MenuItem icon={<Icon icon={faPlusCircle} />} name="artist" value="" onClick={handleClick}>
            Create new artist…
          </MenuItem>
        </MenuList>
      </Menu>
      {releaseErrors.artistName ? (
        <Alert status="error" mt={2}>
          <Icon color={errorAlertColor} fixedWidth icon={faTriangleExclamation} mr={3} />
          {releaseErrors.artistName}
        </Alert>
      ) : null}
    </Flex>
  );
};

export default ArtistMenu;
