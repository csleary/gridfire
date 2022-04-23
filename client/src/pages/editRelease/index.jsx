import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Tab,
  TabList,
  TabPanels,
  TabPanel,
  Tabs,
  Text,
  useColorModeValue
} from "@chakra-ui/react";
import { createRelease, updateRelease } from "features/releases";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdvancedFields from "./advancedFields";
import ArtistMenu from "./artistMenu";
import Artwork from "./artwork";
import Field from "components/field";
import { Helmet } from "react-helmet";
import Icon from "components/icon";
import TrackList from "./trackList";
import { faCheck, faTimes } from "@fortawesome/free-solid-svg-icons";
import { fetchRelease } from "features/releases";
import { toastSuccess } from "features/toast";
import { usePrevious } from "hooks/usePrevious";
import validate from "./validate";

const EditRelease = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { releaseId: releaseIdParam } = useParams();
  const { artists } = useSelector(state => state.artists, shallowEqual);
  const { activeRelease: release, versions } = useSelector(state => state.releases, shallowEqual);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNewArtistName, setShowNewArtistName] = useState(false);
  const [values, setValues] = useState({ tags: [], trackList: [] });
  const { _id: releaseId, artist, artistName, trackList, releaseTitle } = release;
  const prevReleaseId = usePrevious(releaseId);
  const hasErrors = Object.values(errors).some(error => Boolean(error));
  const isEditing = typeof releaseIdParam !== "undefined";
  const isPristine = useMemo(() => JSON.stringify(release) === JSON.stringify(values), [release, values]);

  useEffect(() => {
    if (releaseIdParam) {
      setIsLoading(true);
      dispatch(fetchRelease(releaseIdParam)).then(() => setIsLoading(false));
    } else {
      dispatch(createRelease());
    }
  }, [releaseIdParam]); // eslint-disable-line

  useEffect(() => {
    // Initialise with saved release for editing, or apply default values for new release.
    if ((releaseId === releaseIdParam && !values._id) || (!releaseIdParam && prevReleaseId !== releaseId)) {
      setValues(release);
    }
  }, [prevReleaseId, release, releaseId, releaseIdParam, values._id]);

  useEffect(() => {
    setValues(current => ({
      ...current,
      trackList: current.trackList.map(currentTrack => {
        const updatedTrack = release.trackList.find(({ _id }) => _id === currentTrack._id);
        if (updatedTrack) return { ...currentTrack, status: updatedTrack.status };
        return currentTrack;
      })
    }));
  }, [versions[releaseId]]); // eslint-disable-line

  const handleChange = (e, trackId) => {
    const { name, value } = e.target;

    if (trackId) {
      const trackIndex = trackList.findIndex(({ _id }) => _id === trackId);
      const trackFieldName = `trackList.${trackIndex}.${name}`;
      setErrors(({ [trackFieldName]: excludedField, ...rest }) => rest); // eslint-disable-line

      return setValues(current => ({
        ...current,
        trackList: current.trackList.map(track => (track._id === trackId ? { ...track, [name]: value } : track))
      }));
    }

    setErrors(({ [name]: excludedField, ...rest }) => rest); // eslint-disable-line
    setValues(current => ({ ...current, [name]: value }));
  };

  const handleSubmit = async () => {
    const validationErrors = validate(values);
    if (Object.values(validationErrors).length) return setErrors(validationErrors);
    setIsSubmitting(true);

    dispatch(updateRelease({ releaseId, ...values })).then(() => {
      setIsSubmitting(false);
      dispatch(
        toastSuccess({
          message: `${releaseTitle ? `\u2018${releaseTitle}\u2019` : "Release"} saved!`,
          title: "Success"
        })
      );
      navigate("/dashboard");
    });
  };

  return (
    <>
      <Helmet>
        <title>{isEditing ? "Update Release" : "Add Release"}</title>
        <meta
          name="description"
          content={isEditing ? "Update your releases on GridFire." : "Add a new release to your GridFire account."}
        />
      </Helmet>
      <Container as="main" maxW="container.xl" p={0}>
        <Heading as="h2">
          {isEditing && releaseTitle
            ? `Editing \u2018${releaseTitle}\u2019`
            : isEditing
            ? "Editing Release"
            : "Add Release"}
        </Heading>
        <Tabs colorScheme={useColorModeValue("yellow", "purple")} isFitted mb={8}>
          <TabList mb={8}>
            <Tab>Essential Info</Tab>
            <Tab>Artwork</Tab>
            <Tab>Tracks</Tab>
            <Tab>Optional Info</Tab>
          </TabList>
          <TabPanels>
            <TabPanel p={0}>
              <Heading>Essential Info</Heading>
              <Flex as="section">
                <Box flex="1 1 50%" mr={12}>
                  {isEditing && artist ? (
                    <Field isDisabled isReadOnly label="Artist name" value={artistName} size="lg" />
                  ) : (
                    <>
                      {artists.length ? (
                        <ArtistMenu
                          error={errors.artist}
                          label="Artist name"
                          name="artist"
                          onChange={e => {
                            setErrors(({ artist, artistName, ...rest }) => rest);
                            handleChange(e);
                          }}
                          setShowNewArtist={setShowNewArtistName}
                          showNewArtistName={showNewArtistName}
                          value={values.artist}
                        />
                      ) : null}
                      {!artists.length || showNewArtistName ? (
                        <Field
                          errors={errors}
                          isRequired
                          label={artists.length ? "New artist name" : "Artist name"}
                          name="artistName"
                          onChange={e => {
                            setErrors(({ artist, artistName, ...rest }) => rest);
                            handleChange(e);
                          }}
                          values={values}
                          size="lg"
                        />
                      ) : null}
                    </>
                  )}
                  <Field
                    errors={errors}
                    isRequired
                    label="Release Title"
                    name="releaseTitle"
                    onChange={handleChange}
                    values={values}
                    size="lg"
                  />
                </Box>
                <Box flex="1 1 50%">
                  <Field
                    errors={errors}
                    isRequired
                    label="Release Date"
                    name="releaseDate"
                    onChange={handleChange}
                    type="date"
                    value={(values.releaseDate || new Date(Date.now()).toISOString()).split("T")[0]}
                    size="lg"
                  />
                  <Field
                    errors={errors}
                    isRequired
                    label="Price (USD)"
                    name="price"
                    onChange={handleChange}
                    min={0}
                    type="number"
                    values={values}
                    size="lg"
                  />
                </Box>
              </Flex>
            </TabPanel>
            <TabPanel p={0}>
              <Heading as="h3">Artwork</Heading>
              <Artwork />
            </TabPanel>
            <TabPanel p={0}>
              <Heading as="h3">Track List</Heading>
              <Text mb={4}>Upload formats supported: flac, aiff, wav.</Text>
              <TrackList errors={errors} handleChange={handleChange} setValues={setValues} values={values} />
            </TabPanel>
            <TabPanel p={0}>
              <Heading as="h3">Optional Info</Heading>
              <AdvancedFields errors={errors} handleChange={handleChange} values={values} />
            </TabPanel>
          </TabPanels>
        </Tabs>
        {hasErrors ? (
          <Alert status="error" mb={8}>
            <AlertIcon />
            <AlertTitle mr={2}>Error!</AlertTitle>
            <AlertDescription>Please address the form errors before saving.</AlertDescription>
          </Alert>
        ) : null}
        <Flex justifyContent="flex-end">
          <Button
            colorScheme={useColorModeValue("yellow", "purple")}
            isLoading={isSubmitting}
            loadingText="Saving…"
            leftIcon={isPristine ? null : <Icon icon={hasErrors ? faTimes : faCheck} />}
            isDisabled={hasErrors || isPristine || isSubmitting}
            onClick={handleSubmit}
          >
            {isEditing ? "Update Release" : "Add Release"}
          </Button>
        </Flex>
      </Container>
    </>
  );
};

export default EditRelease;
