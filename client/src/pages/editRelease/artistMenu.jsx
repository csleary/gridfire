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
import PropTypes from "prop-types";
import { faPlusCircle } from "@fortawesome/free-solid-svg-icons";
import { fetchArtists } from "state/artists";
import { useEffect, useState } from "react";

const ArtistMenu = ({ error, onChange, value }) => {
  const dispatch = useDispatch();
  const { artists = [], isLoading } = useSelector(state => state.artists, shallowEqual);
  const [showNewArtistName, setShowNewArtistName] = useState(false);
  const selectedArtist = artists?.find(({ _id: artistId }) => value === artistId);
  const defaultLabel = showNewArtistName ? "New artist" : "Select an artist…";

  useEffect(() => {
    dispatch(fetchArtists());
  }, [dispatch]);

  useEffect(() => {
    if (!isLoading && artists.length > 0) {
      setShowNewArtistName(false);
    } else {
      setShowNewArtistName(true);
    }
  }, [artists.length, isLoading]);

  const handleClick = e => {
    const { value } = e.currentTarget;
    onChange(e);
    setShowNewArtistName(value === null);
  };

  const handleBlur = e => {
    const { value } = e.currentTarget;
    if (!value.trim() && artists.length > 0) {
      setShowNewArtistName(false);
    }
  };

  if (showNewArtistName) {
    return (
      <Field
        isDisabled={isLoading}
        error={error}
        isRequired
        label={artists.length ? "New artist name" : "Artist name"}
        name="artistName"
        onBlur={handleBlur}
        onChange={onChange}
        value={value}
        size="lg"
      />
    );
  }

  return (
    <Flex flexDirection="column" mb={4}>
      <FormLabel color="gray.500" fontWeight={500} mb={1}>
        Artist name
      </FormLabel>
      <Menu matchWidth>
        <MenuButton as={Button} rightIcon={<ChevronDownIcon />} height={12} mb={2}>
          {showNewArtistName ? defaultLabel : selectedArtist?.name || defaultLabel}
        </MenuButton>
        <MenuList>
          {artists.map(({ _id: artistId, name }) => (
            <MenuItem key={artistId} isDisabled={isLoading} name="artist" value={artistId} onClick={handleClick}>
              {name}
            </MenuItem>
          ))}
          {artists.length ? <MenuDivider /> : null}
          <MenuItem
            icon={<Icon icon={faPlusCircle} />}
            name="artist"
            value={null}
            onClick={e => {
              onChange(e);
              setShowNewArtistName(true);
            }}
          >
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

ArtistMenu.propTypes = {
  error: PropTypes.string,
  label: PropTypes.string,
  name: PropTypes.string,
  onChange: PropTypes.func,
  setShowNewArtist: PropTypes.func,
  showNewArtistName: PropTypes.bool,
  value: PropTypes.string
};

export default ArtistMenu;
