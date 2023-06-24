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
import { memo, ChangeEvent, KeyboardEvent, MouseEvent, useCallback, useEffect, useState } from "react";
import { Release, ReleaseErrors, TrackErrors } from "types";
import { createRelease, updateRelease } from "state/releases";
import { defaultReleaseState, fetchReleaseForEditing } from "state/releases";
import { faArrowLeftLong, faCheck, faInfo, faLink, faTimes } from "@fortawesome/free-solid-svg-icons";
import { faFileAudio, faImage, faListAlt } from "@fortawesome/free-regular-svg-icons";
import { useDispatch, useSelector } from "hooks";
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
import { formatPrice } from "utils";
import { shallowEqual } from "react-redux";
import { toastSuccess } from "state/toast";
import validate from "./validate";

const defaultReleaseErrors: ReleaseErrors = {
  artistName: "",
  releaseTitle: "",
  releaseDate: "",
  price: ""
};

const EditRelease = () => {
  const isSmallScreen = useBreakpointValue({ base: false, sm: true, md: false }, { ssr: false });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { releaseId: releaseIdParam } = useParams();
  const { editing: release } = useSelector(state => state.releases, shallowEqual);
  const [errors, setErrors] = useState<ReleaseErrors>(defaultReleaseErrors);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [releaseValues, setReleaseValues] = useState<Release>(defaultReleaseState);
  const [trackErrors, setTrackErrors] = useState<TrackErrors>({});
  const { _id: releaseId } = release;
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
      setReleaseValues({
        ...release,
        releaseDate: DateTime.fromISO(release.releaseDate).toISODate() || ""
      });
      setIsLoading(false);
    }
  }, [release, releaseId, releaseIdParam]);

  const handleChange = useCallback(
    (
      e:
        | ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
        | KeyboardEvent<HTMLInputElement>
        | MouseEvent<HTMLButtonElement>
    ) => {
      const { name, type, value } = e.currentTarget;
      const { checked } = e.currentTarget as HTMLInputElement;

      if (errors[name as keyof ReleaseErrors]) {
        setErrors(prev => ({ ...prev, [name]: "" }));
      }

      if (type === "date" && value) {
        const [dateValue] = new Date(value).toISOString().split("T");
        setReleaseValues(prev => ({ ...prev, [name]: dateValue }));
      } else if (name === "artist") {
        setErrors(prev => ({ ...prev, artistName: "" }));
        setReleaseValues(prev => ({ ...prev, artistName: "", [name]: value }));
      } else if (name === "artistName") {
        setReleaseValues(prev => ({ ...prev, artist: "", [name]: value }));
      } else if (name === "price") {
        setReleaseValues(prev => ({ ...prev, [name]: formatPrice(value) }));
      } else if (name === "removeTagsButton") {
        setReleaseValues(prev => ({ ...prev, tags: [] }));
      } else if (name === "tags") {
        const tag = value
          .replace(/[^0-9a-z\s]/gi, "")
          .trim()
          .toLowerCase();

        if (!tag) return;
        setReleaseValues(prev => ({ ...prev, tags: [...new Set([...prev.tags, tag])] }));
      } else {
        setReleaseValues(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
      }
    },
    [errors]
  );

  const handleRemoveTag = useCallback((tag: string) => {
    setReleaseValues(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  }, []);

  const handleSubmit = useCallback(async () => {
    try {
      const { releaseTitle } = releaseValues;
      const [validationErrors = {}, validationTrackErrors = {}] = validate(releaseValues);

      if (Object.values(validationErrors).some(Boolean) || Object.values(validationTrackErrors).length) {
        setErrors(prev => ({ ...prev, ...validationErrors }));
        return void setTrackErrors(validationTrackErrors);
      }

      setIsSubmitting(true);
      await dispatch(updateRelease({ releaseId, ...releaseValues }));
      navigate("/dashboard");
      const message = `${releaseTitle ? `\u2018${releaseTitle}\u2019` : "Release"} has been updated.`;
      dispatch(toastSuccess({ message, title: "Saved" }));
    } finally {
      setIsSubmitting(false);
    }
  }, [dispatch, navigate, releaseId, releaseValues]);

  const { info, credits, catNumber, pubYear, pubName, recordLabel, recYear, recName, tags } = releaseValues;
  const { artist, artistName, releaseTitle, releaseDate, price } = releaseValues;
  const essentialReleaseValues = { artist, artistName, releaseTitle, releaseDate, price };

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
        <Tabs colorScheme={buttonColor} isFitted={!isSmallScreen} mb={8} position="relative">
          <Box position="relative" mb={8}>
            <Box overflow="auto">
              <TabList width={["max-content", "initial"]}>
                <Tab alignItems="center" whiteSpace="nowrap">
                  <Icon icon={faInfo} mr={2} />
                  Essential Info
                  {Object.values(errors).some(Boolean) ? <WarningIcon ml={3} color={errorAlertColor} /> : null}
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
                setErrors={setErrors}
                updateState={handleChange}
                savedState={essentialReleaseValues}
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
                savedState={releaseValues.trackList}
                setTrackErrors={setTrackErrors}
                updateState={setReleaseValues}
              />
            </TabPanel>
            <TabPanel p={0}>
              <DetailedInfo
                errors={errors}
                updateState={handleChange}
                handleRemoveTag={handleRemoveTag}
                savedState={advancedFieldValues}
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

export default memo(EditRelease);
