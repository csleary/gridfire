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
  VStack,
  Wrap,
  WrapItem,
  useColorModeValue
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
} from "state/artists";
import { ChangeEventHandler, useEffect, useState } from "react";
import { faCheck, faChevronDown, faLink, faMinusCircle, faPlusCircle } from "@fortawesome/free-solid-svg-icons";
import { useDispatch, useSelector } from "hooks";
import Card from "components/card";
import Field from "components/field";
import Icon from "components/icon";
import TextAreaWithCharLimit from "components/textAreaWithCharLimit";
import { shallowEqual } from "react-redux";
import { useNavigate } from "react-router-dom";

const Artists = () => {
  const buttonColorScheme = useColorModeValue("yellow", "purple");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const activeArtistId = useSelector(state => state.artists.activeArtistId);
  const artists = useSelector(state => state.artists.artists, shallowEqual);
  const errors = useSelector(state => state.artists.errors, shallowEqual);
  const isLoading = useSelector(state => state.artists.isLoading);
  const isPristine = useSelector(state => state.artists.isPristine);
  const isSubmitting = useSelector(state => state.artists.isSubmitting);
  const [isAddingLink, setIsAddingLink] = useState(false);
  const activeArtist = artists.find(artist => artist._id === activeArtistId);

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

  const handleChange: ChangeEventHandler<HTMLInputElement> = e => {
    dispatch(setIsPristine(false));
    const { name, value } = e.currentTarget;

    if (name === "biography" && value.length > 2000) {
      return dispatch(setErrors({ name, value: "Please keep your biography to under 2000 characters." }));
    }

    if ((name.endsWith("title") || name.endsWith("uri")) && value.length > 200) {
      return dispatch(setErrors({ name: "links", value: "Please keep your links to under 200 characters." }));
    }

    dispatch(setValues({ artistId: activeArtistId, name, value }));
    dispatch(setErrors(null));
  };

  const handleSubmit = async () => {
    if (!activeArtist) return;
    dispatch(updateArtist(activeArtist));
  };

  const handleAddLink = async () => {
    if (activeArtist?.links?.length === 10) {
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
            <MenuButton as={Button} rightIcon={<Icon fixedWidth icon={faChevronDown} />} width="100%">
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
                colorScheme={buttonColorScheme}
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
            <TextAreaWithCharLimit
              limit={2000}
              onChange={handleChange}
              minHeight={64}
              value={activeArtist.biography || ""}
            />
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
                      aria-label="Remove link"
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
              colorScheme={buttonColorScheme}
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
