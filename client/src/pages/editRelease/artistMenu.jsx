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
import Icon from "components/icon";
import PropTypes from "prop-types";
import { faPlusCircle } from "@fortawesome/free-solid-svg-icons";
import { fetchArtists } from "features/artists";
import { useEffect } from "react";

const ArtistMenu = ({ error, label, name, onChange, setShowNewArtist, showNewArtistName, value }) => {
  const dispatch = useDispatch();
  const { artists, isLoading } = useSelector(state => state.artists, shallowEqual);
  const artistCount = artists?.length;
  const selectedArtist = artists?.find(({ _id: artistId }) => value === artistId);
  const defaultLabel = showNewArtistName ? "New artist" : "Select an artist…";

  useEffect(() => {
    dispatch(fetchArtists());
  }, [dispatch]);

  useEffect(() => {
    if (!isLoading && artistCount === 0 && !showNewArtistName) {
      setShowNewArtist(true);
    }
  }, [artistCount, isLoading, setShowNewArtist, showNewArtistName]);

  return (
    <Flex flexDirection="column" mb={4}>
      <Box as="label" htmlFor={name} color="gray.500" fontWeight={500}>
        {label}
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
                onChange({ target: { name, value: artist._id } });
                if (showNewArtistName) setShowNewArtist(false);
              }}
            >
              {artist.name}
            </MenuItem>
          ))}
          <MenuDivider />
          <MenuItem
            icon={<Icon icon={faPlusCircle} />}
            onClick={() => {
              onChange({ target: { name, value: null } });
              setShowNewArtist(true);
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
