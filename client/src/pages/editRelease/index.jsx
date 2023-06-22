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
  useBreakpointValue,
  useColorModeValue
} from "@chakra-ui/react";
import { createRelease, updateRelease } from "state/releases";
import { faArrowLeftLong, faCheck, faInfo, faLink, faTimes } from "@fortawesome/free-solid-svg-icons";
import { faFileAudio, faImage, faListAlt } from "@fortawesome/free-regular-svg-icons";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Artwork from "./artwork";
import { DateTime } from "luxon";
import DetailedInfo from "./detailedInfo";
import EssentialInfo from "./essentialInfo";
import { Helmet } from "react-helmet";
import Icon from "components/icon";
import TrackList from "./trackList";
import Editions from "./mintEdition";
import { WarningIcon } from "@chakra-ui/icons";
import { faEthereum } from "@fortawesome/free-brands-svg-icons";
import { fetchReleaseForEditing } from "state/releases";
import { formatPrice } from "utils";
import { toastSuccess } from "state/toast";
import validate from "./validate";

const EditRelease = () => {
  const isSmallScreen = useBreakpointValue({ base: false, sm: true, md: false }, { ssr: false });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { releaseId: releaseIdParam } = useParams();
  const { editing: release } = useSelector(state => state.releases, shallowEqual);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [trackErrors, setTrackErrors] = useState({});
  const [values, setValues] = useState({ tags: [], trackList: [] });

  const { _id: releaseId, releaseTitle } = release;
  const hasError = Object.values(errors).some(Boolean);
  const hasTrackError = Object.values(trackErrors).some(Boolean);
  const isEditing = typeof releaseIdParam !== "undefined";
  const errorAlertColor = useColorModeValue("red.800", "red.200");
  const buttonColor = useColorModeValue("yellow", "purple");

  useEffect(() => {
    if (releaseIdParam) {
      dispatch(fetchReleaseForEditing(releaseIdParam));
    } else {
      dispatch(createRelease());
    }
  }, [releaseIdParam]); // eslint-disable-line

  useEffect(() => {
    if (releaseId) {
      setValues({ ...release, releaseDate: DateTime.fromISO(release.releaseDate).toISODate() });
      setIsLoading(false);
    }
  }, [release, releaseId, releaseIdParam]);

  const handleChange = useCallback((e, trackId) => {
    const { checked, name, type, value } = e.currentTarget;

    if (trackId) {
      setTrackErrors(({ [`${trackId}.${name}`]: key, ...rest }) => rest);

      return void setValues(current => ({
        ...current,
        trackList: current.trackList.map(track =>
          track._id === trackId ? { ...track, [name]: type === "checkbox" ? checked : value } : track
        )
      }));
    }

    setErrors(({ [name]: fieldName, ...rest }) => rest);

    if (type === "date" && value) {
      const [dateValue] = new Date(value).toISOString().split("T");
      setValues(prev => ({ ...prev, [name]: dateValue }));
    } else if (name === "artist") {
      setErrors(({ artistName, ...rest }) => rest);
      setValues(({ artistName, ...prev }) => ({ ...prev, [name]: value }));
    } else if (name === "artistName") {
      setValues(({ artist, ...prev }) => ({ ...prev, [name]: value }));
    } else if (name === "price") {
      setValues(prev => ({ ...prev, [name]: formatPrice(value) }));
    } else if (name === "removeTagsButton") {
      setValues(prev => ({ ...prev, tags: [] }));
    } else if (name === "tags") {
      const tag = value
        .replace(/[^0-9a-z\s]/gi, "")
        .trim()
        .toLowerCase();

      if (!tag) return;
      setValues(prev => ({ ...prev, tags: [...new Set([...prev.tags, tag])] }));
    } else {
      setValues(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    }
  }, []);

  const handleRemoveTag = useCallback(tag => {
    setValues(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  }, []);

  const handleSubmit = useCallback(async () => {
    try {
      const { releaseTitle } = values;
      const [validationErrors = {}, validationTrackErrors = {}] = validate(values);

      if (Object.values(validationErrors).length || Object.values(validationTrackErrors).length) {
        setErrors(validationErrors);
        return void setTrackErrors(validationTrackErrors);
      }

      setIsSubmitting(true);
      await dispatch(updateRelease({ releaseId, ...values }));
      navigate("/dashboard");
      const message = `${releaseTitle ? `\u2018${releaseTitle}\u2019` : "Release"} has been updated.`;
      dispatch(toastSuccess({ message, title: "Saved" }));
    } finally {
      setIsSubmitting(false);
    }
  }, [dispatch, navigate, releaseId, values]);

  const { info, credits, catNumber, pubYear, pubName, recordLabel, recYear, recName, tags } = values;

  const advancedFieldValues = {
    info,
    credits,
    catNumber,
    pubYear,
    pubName,
    recordLabel,
    recYear,
    recName,
    tags
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
          <Button
            colorScheme={buttonColor}
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
        <Button
          colorScheme={buttonColor}
          leftIcon={<Icon icon={faArrowLeftLong} />}
          onClick={() => navigate("/dashboard")}
          size="sm"
          variant="ghost"
          mb={4}
        >
          Return to your releases
        </Button>
        <Tabs colorScheme={buttonColor} isFitted={!isSmallScreen} mb={8} overflow="auto" position="relative">
          <Box position="relative" mb={8}>
            <Box overflow="auto">
              <TabList
                width={["max-content", "initial"]}
                _before={{
                  background:
                    "linear-gradient(90deg, var(--chakra-colors-gray-900) 0%, var(--chakra-colors-transparent) 100%)",
                  content: `""`,
                  display: ["block", "none"],
                  position: "absolute",
                  left: "0",
                  top: "0",
                  bottom: "0",
                  width: 4
                }}
                _after={{
                  background:
                    "linear-gradient(270deg, var(--chakra-colors-gray-900) 0%, var(--chakra-colors-transparent) 100%)",
                  content: `""`,
                  display: ["block", "none"],
                  position: "absolute",
                  right: "0",
                  top: "0",
                  bottom: "0",
                  width: 4
                }}
              >
                <Tab alignItems="center" whiteSpace="nowrap">
                  <Icon icon={faInfo} mr={2} />
                  Essential Info
                  {Object.values(errors).length ? <WarningIcon ml={3} color={errorAlertColor} /> : null}
                </Tab>
                <Tab alignItems="center" whiteSpace="nowrap">
                  <Icon icon={faImage} mr={2} />
                  Artwork
                </Tab>
                <Tab alignItems="center" whiteSpace="nowrap">
                  <Icon icon={faEthereum} mr={2} />
                  Editions
                </Tab>
                <Tab alignItems="center" whiteSpace="nowrap">
                  <Icon icon={faFileAudio} mr={2} />
                  Tracks
                  {Object.values(trackErrors).length ? <WarningIcon ml={3} color={errorAlertColor} /> : null}
                </Tab>
                <Tab alignItems="center" whiteSpace="nowrap">
                  <Icon icon={faListAlt} mr={2} />
                  Optional Info
                </Tab>
              </TabList>
            </Box>
          </Box>
          <TabPanels>
            <TabPanel p={0}>
              <EssentialInfo
                errors={errors}
                isEditing={isEditing}
                isLoading={isLoading}
                setErrors={setErrors}
                setValues={setValues}
                updateRelease={handleChange}
                savedValues={values}
              />
            </TabPanel>
            <TabPanel p={0}>
              <Artwork />
            </TabPanel>
            <TabPanel p={0}>
              <Editions />
            </TabPanel>
            <TabPanel p={0}>
              <TrackList
                errors={trackErrors}
                handleChange={handleChange}
                setValues={setValues}
                trackList={values.trackList}
              />
            </TabPanel>
            <TabPanel p={0}>
              <DetailedInfo
                errors={errors}
                updateRelease={handleChange}
                handleRemoveTag={handleRemoveTag}
                savedValues={advancedFieldValues}
              />
            </TabPanel>
          </TabPanels>
        </Tabs>
        {hasError || hasTrackError ? (
          <Alert status="error" mb={8}>
            <AlertIcon />
            <AlertTitle mr={2}>Error!</AlertTitle>
            <AlertDescription>Please address the form errors before saving.</AlertDescription>
          </Alert>
        ) : null}
        <Flex justifyContent="flex-end">
          <Button
            colorScheme={buttonColor}
            isLoading={isSubmitting}
            loadingText="Saving…"
            leftIcon={<Icon icon={hasError || hasTrackError ? faTimes : faCheck} />}
            isDisabled={hasError || hasTrackError || isSubmitting}
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
