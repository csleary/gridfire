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
import { createRelease, updateRelease } from "state/releases";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdvancedFields from "./advancedFields";
import ArtistMenu from "./artistMenu";
import Artwork from "./artwork";
import Field from "components/field";
import { Helmet } from "react-helmet";
import Icon from "components/icon";
import IpfsStorage from "./ipfsStorage";
import TrackList from "./trackList";
import { faCheck, faInfo, faLink, faTimes } from "@fortawesome/free-solid-svg-icons";
import { fetchRelease } from "state/releases";
import { toastSuccess } from "state/toast";
import { usePrevious } from "hooks/usePrevious";
import validate from "./validate";
import { faFileAudio, faHdd, faImage, faListAlt } from "@fortawesome/free-regular-svg-icons";

const EditRelease = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { releaseId: releaseIdParam } = useParams();
  const { artists } = useSelector(state => state.artists, shallowEqual);
  const { activeRelease: release } = useSelector(state => state.releases, shallowEqual);
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
  }, [release.trackList]);

  const handleChange = useCallback(
    (e, trackId) => {
      const { name, value } = e.target;

      if (trackId) {
        const trackIndex = trackList.findIndex(({ _id }) => _id === trackId);
        const trackFieldName = `trackList.${trackIndex}.${name}`;
        setErrors(({ [trackFieldName]: excludedField, ...rest }) => rest);

        return void setValues(current => ({
          ...current,
          trackList: current.trackList.map(track => (track._id === trackId ? { ...track, [name]: value } : track))
        }));
      }

      setErrors(({ [name]: excludedField, ...rest }) => rest);
      setValues(current => ({ ...current, [name]: value }));
    },
    [trackList]
  );

  const handleChangePrice = useCallback(({ target: { name, value } }) => {
    setErrors(({ [name]: excludedField, ...rest }) => rest);
    const numbersOnly = value.replace(/[^0-9.]/g, "");
    setValues(current => ({ ...current, [name]: numbersOnly }));
  }, []);

  const formatPrice = () => {
    setValues(current => {
      const [integer = 0, float = 0] = current.price.toString().split(".");
      const priceAsFloatString = `${integer}.${float}`;
      const rounded = +(Math.ceil(Math.abs(priceAsFloatString) + "e+2") + "e-2");
      const price = Number.isNaN(rounded) ? Number.MAX_SAFE_INTEGER.toFixed(2) : rounded.toFixed(2);
      return { ...current, price };
    });
  };

  const handleSubmit = async () => {
    const validationErrors = validate(values);
    if (Object.values(validationErrors).length) return setErrors(validationErrors);
    setIsSubmitting(true);

    dispatch(updateRelease({ releaseId, ...values })).then(() => {
      setIsSubmitting(false);
      dispatch(
        toastSuccess({
          message: `${releaseTitle ? `\u2018${releaseTitle}\u2019` : "Release"} has been updated.`,
          title: "Saved"
        })
      );
      navigate("/dashboard");
    });
  };

  const { info, credits, catNumber, pubYear, pubName, recordLabel, recYear, recName, tags } = values;
  const advancedFieldValues = { info, credits, catNumber, pubYear, pubName, recordLabel, recYear, recName, tags };

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
          <Button
            colorScheme={useColorModeValue("yellow", "purple")}
            leftIcon={<Icon icon={faLink} />}
            onClick={() => navigate(`/release/${releaseId}`)}
            size="sm"
            title="Visit artist page."
            variant="ghost"
            ml={2}
          >
            Visit page
          </Button>
        </Heading>
        <Tabs colorScheme={useColorModeValue("yellow", "purple")} isFitted mb={8}>
          <TabList mb={8}>
            <Tab alignItems="center">
              <Icon icon={faInfo} mr={2} />
              Essential Info
            </Tab>
            <Tab alignItems="center">
              <Icon icon={faImage} mr={2} />
              Artwork
            </Tab>
            <Tab alignItems="center">
              <Icon icon={faFileAudio} mr={2} />
              Tracks
            </Tab>
            <Tab alignItems="center">
              <Icon icon={faListAlt} mr={2} />
              Optional Info
            </Tab>
            <Tab alignItems="center">
              <Icon icon={faHdd} mr={2} />
              IPFS Storage
            </Tab>
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
                    info="We will round this up to the nearest penny."
                    inputMode="numeric"
                    isRequired
                    label="Price (DAI/USD)"
                    name="price"
                    onBlur={formatPrice}
                    onChange={handleChangePrice}
                    type="text"
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
              <Text mb={4}>
                Upload formats supported: flac, aiff, wav.
                <br />
                Click or drop a file into the dashed box to upload.
                <br />
                Drag and drop to rearrange tracks.
                <br />
              </Text>
              <TrackList
                errors={{ errors: errors.trackList }}
                handleChange={handleChange}
                setValues={setValues}
                trackList={values.trackList}
              />
            </TabPanel>
            <TabPanel p={0}>
              <Heading as="h3">Optional Info</Heading>
              <AdvancedFields errors={errors} handleChange={handleChange} values={advancedFieldValues} />
            </TabPanel>
            <TabPanel p={0}>
              <Heading as="h3">IPFS Storage</Heading>
              <IpfsStorage />
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
