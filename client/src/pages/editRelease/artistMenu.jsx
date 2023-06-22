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
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import { ChevronDownIcon } from "@chakra-ui/icons";
import Field from "components/field";
import Icon from "components/icon";
import { faPlusCircle } from "@fortawesome/free-solid-svg-icons";
import { fetchArtists } from "state/artists";
import { useEffect, useState } from "react";

const ArtistMenu = ({ error, onChange, updateRelease, values }) => {
  const dispatch = useDispatch();
  const { artists = [], isLoading } = useSelector(state => state.artists, shallowEqual);
  const [showInput, setShowInput] = useState(false);
  const selectedArtist = artists?.find(({ _id: artistId }) => values.artist === artistId);
  const defaultLabel = showInput ? "New artist" : "Select an artist…";

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

  const handleClick = e => {
    const { value } = e.currentTarget;

    if (value === "") {
      setShowInput(true);
      onChange(e);
      updateRelease(e);
    } else {
      updateRelease(e);
    }
  };

  const handleBlur = e => {
    const { value } = e.currentTarget;
    updateRelease(e);

    if (!value.trim() && artists.length > 0) {
      setShowInput(false);
    }
  };

  if (showInput) {
    return (
      <Field
        isDisabled={isLoading}
        error={error}
        isRequired
        label={artists.length ? "New artist name" : "Artist name"}
        name="artistName"
        onBlur={handleBlur}
        onChange={onChange}
        values={values}
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
      {error ? (
        <Alert status="error">
          <AlertIcon />
          {error}
        </Alert>
      ) : null}
    </Flex>
  );
};

export default ArtistMenu;
