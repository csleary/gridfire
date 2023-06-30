import {
  Alert,
  AlertIcon,
  Button,
  Flex,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  FormLabel
} from "@chakra-ui/react";
import { useDispatch, useSelector } from "hooks";
import { ChevronDownIcon } from "@chakra-ui/icons";
import Field from "components/field";
import Icon from "components/icon";
import { faPlusCircle } from "@fortawesome/free-solid-svg-icons";
import { fetchArtists } from "state/artists";
import { shallowEqual } from "react-redux";
import { updateRelease } from "state/editor";
import { ChangeEventHandler, MouseEventHandler, useEffect, useState } from "react";

const ArtistMenu = () => {
  const dispatch = useDispatch();
  const { releaseErrors, release } = useSelector(state => state.editor, shallowEqual);
  const { artists = [], isLoading } = useSelector(state => state.artists, shallowEqual);
  const [showInput, setShowInput] = useState(false);
  const { artist, artistName } = release;
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
        <MenuButton as={Button} rightIcon={<ChevronDownIcon />} height={12} mb={2}>
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
        <Alert status="error">
          <AlertIcon />
          {releaseErrors.artistName}
        </Alert>
      ) : null}
    </Flex>
  );
};

export default ArtistMenu;
