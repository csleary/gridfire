import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Button,
  Container,
  Flex,
  Heading,
  Tab,
  TabList,
  TabPanels,
  TabPanel,
  Tabs,
  useColorModeValue
} from "@chakra-ui/react";
import { createRelease, updateRelease } from "state/releases";
import { faCheck, faInfo, faLink, faTimes } from "@fortawesome/free-solid-svg-icons";
import { faFileAudio, faHdd, faImage, faListAlt } from "@fortawesome/free-regular-svg-icons";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Artwork from "./artwork";
import DetailedInfo from "./detailedInfo";
import EssentialInfo from "./essentialInfo";
import { Helmet } from "react-helmet";
import Icon from "components/icon";
import IpfsStorage from "./ipfsStorage";
import TrackList from "./trackList";
import { WarningIcon } from "@chakra-ui/icons";
import { fetchRelease } from "state/releases";
import { toastSuccess } from "state/toast";
import { usePrevious } from "hooks/usePrevious";
import validate from "./validate";

const EditRelease = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { releaseId: releaseIdParam } = useParams();
  const { activeRelease: release } = useSelector(state => state.releases, shallowEqual);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [trackErrors, setTrackErrors] = useState({});
  const [values, setValues] = useState({ tags: [], trackList: [] });
  const { _id: releaseId, releaseTitle } = release;
  const prevReleaseId = usePrevious(releaseId);
  const hasError = Object.values(errors).some(Boolean);
  const hasTrackError = Object.values(trackErrors).some(Boolean);
  const isEditing = typeof releaseIdParam !== "undefined";
  const isPristine = useMemo(() => JSON.stringify(release) === JSON.stringify(values), [release, values]);
  const errorAlertColor = useColorModeValue("red.800", "red.200");
  const buttonColor = useColorModeValue("yellow", "purple");

  useEffect(() => {
    if (releaseIdParam) {
      setIsLoading(true);
      dispatch(fetchRelease(releaseIdParam));
    } else {
      dispatch(createRelease());
    }
  }, [releaseIdParam]); // eslint-disable-line

  useEffect(() => {
    // Initialise with saved release for editing.
    if (releaseId === releaseIdParam && !values._id) {
      setValues(release);
      setIsLoading(false);
    }
  }, [isLoading, prevReleaseId, release, releaseId, releaseIdParam, values._id]);

  useEffect(() => {
    // Apply default values for new release.
    if (!releaseIdParam && prevReleaseId !== releaseId) {
      setValues(release);
    }
  }, [isLoading, prevReleaseId, release, releaseId, releaseIdParam, values._id]);

  const handleChange = useCallback((e, trackId) => {
    const { name, value } = e.target;

    if (trackId) {
      setTrackErrors(({ [`${trackId}.${name}`]: key, ...rest }) => rest);

      return void setValues(current => ({
        ...current,
        trackList: current.trackList.map(track => (track._id === trackId ? { ...track, [name]: value } : track))
      }));
    }

    setErrors(({ [name]: key, ...rest }) => rest);
    setValues(current => ({ ...current, [name]: value }));
  }, []);

  const handleSubmit = async () => {
    const [validationErrors = {}, validationTrackErrors = {}] = validate(values);
    if (Object.values(validationErrors).length || Object.values(validationTrackErrors).length) {
      setErrors(validationErrors);
      return setTrackErrors(validationTrackErrors);
    }

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

  console.log(values);

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
        <Tabs colorScheme={buttonColor} isFitted mb={8}>
          <TabList mb={8}>
            <Tab alignItems="center">
              <Icon icon={faInfo} mr={2} />
              Essential Info
              {Object.values(errors).length ? <WarningIcon ml={3} color={errorAlertColor} /> : null}
            </Tab>
            <Tab alignItems="center">
              <Icon icon={faImage} mr={2} />
              Artwork
            </Tab>
            <Tab alignItems="center">
              <Icon icon={faFileAudio} mr={2} />
              Tracks
              {Object.values(trackErrors).length ? <WarningIcon ml={3} color={errorAlertColor} /> : null}
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
              <EssentialInfo
                errors={errors}
                isEditing={isEditing}
                isLoading={isLoading}
                setErrors={setErrors}
                setValues={setValues}
                handleChange={handleChange}
                values={values}
              />
            </TabPanel>
            <TabPanel p={0}>
              <Artwork />
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
              <DetailedInfo errors={errors} handleChange={handleChange} values={advancedFieldValues} />
            </TabPanel>
            <TabPanel p={0}>
              <IpfsStorage />
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
            leftIcon={isPristine ? null : <Icon icon={hasError || hasTrackError ? faTimes : faCheck} />}
            isDisabled={hasError || hasTrackError || isPristine || isSubmitting}
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
