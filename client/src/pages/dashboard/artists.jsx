import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Container,
  Flex,
  Heading,
  IconButton,
  Input,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
  Textarea,
  VStack,
  Wrap,
  WrapItem
} from "@chakra-ui/react";
import {
  addLink,
  fetchArtists,
  removeLink,
  setActiveArtistId,
  setErrors,
  setIsLoading,
  setIsPristine,
  setValues,
  updateArtist
} from "features/artists";
import { faCheck, faLink, faMinusCircle, faPlusCircle } from "@fortawesome/free-solid-svg-icons";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import Card from "components/card";
import { ChevronDownIcon } from "@chakra-ui/icons";
import Icon from "components/icon";
import { useNavigate } from "react-router-dom";
import Field from "components/field";

const Artists = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { activeArtistId, artists, errors, isLoading, isPristine, isSubmitting } = useSelector(
    state => state.artists,
    shallowEqual
  );
  const [isAddingLink, setIsAddingLink] = useState(false);
  const activeArtist = artists.find(artist => artist._id === activeArtistId);
  const charsRemaining = 2000 - (activeArtist?.biography?.length ?? 0);

  useEffect(() => {
    if (!artists.length) {
      dispatch(setIsLoading(true));
    } else {
      dispatch(setActiveArtistId(artists[0]._id));
    }
  }, [artists.length]); // eslint-disable-line

  useEffect(() => {
    dispatch(fetchArtists()).then(() => dispatch(setIsLoading(false)));
  }, []); // eslint-disable-line

  const handleChange = e => {
    dispatch(setIsPristine(false));
    const { name, value } = e.target;

    if (name === "biography" && value.length > 2000) {
      return dispatch(setErrors({ name, value: "Please keep your biography to under 2000 characters." }));
    }

    if ((name.endsWith("title") || name.endsWith("uri")) && value.length > 200) {
      return dispatch(setErrors({ name: "links", value: "Please keep your links to under 200 characters." }));
    }

    dispatch(setValues({ artistId: activeArtistId, name, value }));
    dispatch(setErrors());
  };

  const handleSubmit = async () => {
    dispatch(updateArtist(activeArtist));
  };

  const handleAddLink = async () => {
    if (activeArtist.links?.length === 10) {
      setIsAddingLink(false);
      return dispatch(setErrors({ name: "links", value: "You can have a maximum of ten links." }));
    }

    setIsAddingLink(true);
    await dispatch(addLink(activeArtistId));
    setIsAddingLink(false);
    dispatch(setErrors({ name: "links", value: "" }));
  };

  return (
    <Container as="main" maxW="container.md" p={0}>
      {artists.length ? (
        <Heading as="h2">Artists</Heading>
      ) : (
        <>
          <Heading as="h3">Add a release first</Heading>
          <Text textAlign="center">
            Once you&rsquo;ve added a release you&rsquo;ll then be able to add additional artist info here.
          </Text>
        </>
      )}
      {artists.length > 1 ? (
        <Card>
          <Text mb={4}>Select an artist to edit their details:</Text>
          <Menu matchWidth>
            <MenuButton as={Button} rightIcon={<ChevronDownIcon />} width="100%">
              {activeArtist?.name ?? "Select…"}
            </MenuButton>
            <MenuList>
              {artists.map(artist => (
                <MenuItem key={artist._id} onClick={() => dispatch(setActiveArtistId(artist._id))}>
                  {artist.name}
                </MenuItem>
              ))}
            </MenuList>
          </Menu>
        </Card>
      ) : null}
      {activeArtist ? (
        <>
          <Heading as="h3">{activeArtist.name}</Heading>
          <Card as="section">
            <Flex justifyContent="space-between" mb={6}>
              <Box color="gray.500" fontSize="xl" fontWeight={500}>
                Artist Name
              </Box>
              <Button
                colorScheme="blue"
                leftIcon={<Icon icon={faLink} />}
                onClick={() => navigate(activeArtist.slug ? `/${activeArtist.slug}` : `/artist/${activeArtistId}`)}
                size="sm"
                title="Visit artist page."
                variant="ghost"
                ml={2}
              >
                Visit page
              </Button>
            </Flex>
            <Text mb={4}>Rename your artist or set a unique URL stem for your artist page.</Text>
            <Field errors={errors} label="Name" name="name" onChange={handleChange} values={activeArtist} />
            <Field
              errors={errors}
              info="Alphanumerics and dashes only."
              label="URL Slug"
              name="slug"
              onChange={handleChange}
              values={activeArtist}
            />
          </Card>
          <Card as="section">
            <Box as="label" htmlFor="biography" color="gray.500" display="block" fontSize="xl" fontWeight={500} mb={4}>
              Biography
            </Box>
            <Textarea id="biography" name="biography" onChange={handleChange} value={activeArtist.biography || ""} />
            <Text
              color={charsRemaining === 0 ? "red.500" : charsRemaining < 100 ? "orange.500" : "gray.500"}
              fontSize="sm"
              fontWeight={charsRemaining === 0 && 500}
            >{`${charsRemaining} character${charsRemaining === 1 ? "" : "s"} remaining`}</Text>
            {errors.biography ? (
              <Alert status="warning" mt={2}>
                <AlertIcon />
                {errors.biography}
              </Alert>
            ) : null}
          </Card>
          <Card as="section">
            <Box color="gray.500" fontSize="xl" fontWeight={500} mb={6}>
              Links
            </Box>
            <VStack spacing={2} alignItems="stretch" mb={6}>
              {activeArtist.links?.map(({ _id: linkId, title, uri }) => (
                <Wrap key={linkId} spacing={4} alignItems="flex-end">
                  <WrapItem as="label" alignItems="center" flex={1}>
                    <Box as="span" color="gray.500" mr={2}>
                      Text
                    </Box>
                    <Input id={`${linkId}.title`} name={`${linkId}.title`} onChange={handleChange} value={title} />
                  </WrapItem>
                  <WrapItem as="label" alignItems="center" flex={1}>
                    <Box as="span" color="gray.500" mr={2}>
                      URL
                    </Box>
                    <Input id={`${linkId}.uri`} name={`${linkId}.uri`} onChange={handleChange} value={uri} />
                  </WrapItem>
                  <WrapItem alignItems="center">
                    <IconButton
                      colorScheme="red"
                      icon={<Icon icon={faMinusCircle} />}
                      onClick={() => dispatch(removeLink({ artistId: activeArtistId, linkId }))}
                      title="Remove link"
                      variant="ghost"
                    />
                  </WrapItem>
                </Wrap>
              ))}
            </VStack>
            <Button
              isLoading={isAddingLink}
              leftIcon={<Icon icon={faPlusCircle} />}
              onClick={() => handleAddLink()}
              size="sm"
              title="Add a link"
              mb={2}
            >
              Add a link
            </Button>
            {errors.links ? (
              <Alert status="error">
                <AlertIcon />
                {errors.links}
              </Alert>
            ) : (
              <Text fontSize="sm">10 max.</Text>
            )}
          </Card>
          <Flex justifyContent="flex-end">
            <Button
              colorScheme="blue"
              isLoading={isSubmitting}
              isDisabled={isPristine}
              leftIcon={<Icon icon={faCheck} />}
              loadingText="Saving"
              onClick={handleSubmit}
            >
              Save
            </Button>
          </Flex>
        </>
      ) : null}
    </Container>
  );
};

export default Artists;
