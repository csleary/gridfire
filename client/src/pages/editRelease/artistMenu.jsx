import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Flex,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider
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
    if (isLoading) return;
    if (artists.length > 0) {
      setShowNewArtistName(false);
    } else {
      setShowNewArtistName(true);
    }
  }, [artists.length, isLoading]);

  if (showNewArtistName) {
    return (
      <Field
        error={error}
        isRequired
        label={artists.length ? "New artist name" : "Artist name"}
        name="artistName"
        onChange={onChange}
        value={value}
        size="lg"
      />
    );
  }

  return (
    <Flex flexDirection="column" mb={4}>
      <Box as="label" color="gray.500" fontWeight={500}>
        Artist name
      </Box>
      <Menu matchWidth>
        <MenuButton as={Button} rightIcon={<ChevronDownIcon />} height={12} mb={2}>
          {showNewArtistName ? defaultLabel : selectedArtist?.name || defaultLabel}
        </MenuButton>
        <MenuList>
          {artists.map(artist => (
            <MenuItem
              key={artist._id}
              onClick={() => {
                onChange({ target: { name: "artist", value: artist._id } });
                if (showNewArtistName) setShowNewArtistName(false);
              }}
            >
              {artist.name}
            </MenuItem>
          ))}
          {artists.length ? <MenuDivider /> : null}
          <MenuItem
            icon={<Icon icon={faPlusCircle} />}
            onClick={() => {
              onChange({ target: { name: "artist", value: null } });
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
