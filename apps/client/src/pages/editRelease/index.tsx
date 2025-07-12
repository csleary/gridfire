import {
  Alert,
  AlertDescription,
  AlertTitle,
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  useBreakpointValue,
  useColorModeValue
} from "@chakra-ui/react";
import { faEthereum } from "@fortawesome/free-brands-svg-icons";
import { faFileAudio, faImage, faListAlt } from "@fortawesome/free-regular-svg-icons";
import {
  faArrowLeftLong,
  faCheck,
  faInfo,
  faLink,
  faTimes,
  faTriangleExclamation
} from "@fortawesome/free-solid-svg-icons";
import { lazy, useEffect } from "react";
import { Helmet } from "react-helmet";
import { shallowEqual } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";

import Icon from "@/components/icon";
import { useDispatch, useSelector } from "@/hooks";
import { createRelease, fetchReleaseForEditing, saveRelease } from "@/state/editor";
const Artwork = lazy(() => import("./artwork"));
const DetailedInfo = lazy(() => import("./detailedInfo"));
const Editions = lazy(() => import("./mintEdition"));
const EssentialInfo = lazy(() => import("./essentialInfo"));
const TrackList = lazy(() => import("./trackList"));

const EditRelease = () => {
  const isSmallScreen = useBreakpointValue({ base: false, md: false, sm: true }, { ssr: false });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { releaseId: releaseIdParam } = useParams();
  const isLoading = useSelector(state => state.editor.isLoading);
  const isSubmitting = useSelector(state => state.editor.isSubmitting);
  const releaseErrors = useSelector(state => state.editor.releaseErrors, shallowEqual);
  const releaseId = useSelector(state => state.editor.release._id);
  const releaseTitle = useSelector(state => state.editor.release.releaseTitle);
  const trackErrors = useSelector(state => state.editor.trackErrors, shallowEqual);
  const hasReleaseError = Object.values(releaseErrors).some(Boolean);
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

  const handleSubmit = async () => {
    const hasErrors = await dispatch(saveRelease());
    if (hasErrors) return;
    navigate("/dashboard");
  };

  return (
    <>
      <Helmet>
        <title>{isEditing ? "Update Release" : "Add Release"}</title>
        <meta
          content={isEditing ? "Update your releases on Gridfire." : "Add a new release to your Gridfire account."}
          name="description"
        />
      </Helmet>
      <Container as="main" maxW="container.xl" p={0}>
        <Heading as="h2">
          {isEditing && releaseTitle ? `Editing '${releaseTitle}'` : isEditing ? "Editing Release" : "Add Release"}
          <Button
            colorScheme={buttonColor}
            leftIcon={<Icon icon={faLink} />}
            ml={2}
            onClick={() => navigate(`/release/${releaseId}`)}
            size="sm"
            title="Visit artist page."
            variant="ghost"
          >
            Visit page
          </Button>
        </Heading>
        <Button
          colorScheme={buttonColor}
          leftIcon={<Icon icon={faArrowLeftLong} />}
          mb={4}
          onClick={() => navigate("/dashboard")}
          size="sm"
          variant="ghost"
        >
          Return to your releases
        </Button>
        <Tabs colorScheme={buttonColor} isFitted={!isSmallScreen} mb={8} position="relative">
          <Box mb={8} position="relative">
            <Box overflow="auto">
              <TabList width={["max-content", "initial"]}>
                <Tab alignItems="center" whiteSpace="nowrap">
                  <Icon icon={faInfo} mr={2} />
                  Essential Info
                  {hasReleaseError ? (
                    <Icon color={errorAlertColor} fixedWidth icon={faTriangleExclamation} ml={3} />
                  ) : null}
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
                  {hasTrackError ? (
                    <Icon color={errorAlertColor} fixedWidth icon={faTriangleExclamation} ml={3} />
                  ) : null}
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
              <EssentialInfo isEditing={isEditing} />
            </TabPanel>
            <TabPanel p={0}>
              <Artwork />
            </TabPanel>
            <TabPanel p={0}>
              <Editions />
            </TabPanel>
            <TabPanel p={0}>
              <TrackList />
            </TabPanel>
            <TabPanel p={0}>
              <DetailedInfo />
            </TabPanel>
          </TabPanels>
        </Tabs>
        {hasReleaseError || hasTrackError ? (
          <Alert mb={8} status="error">
            <Icon color={errorAlertColor} fixedWidth icon={faTriangleExclamation} mr={3} />
            <AlertTitle mr={2}>Error!</AlertTitle>
            <AlertDescription>Please address the form errors before saving.</AlertDescription>
          </Alert>
        ) : null}
        <Flex justifyContent="flex-end">
          <Button
            colorScheme={buttonColor}
            isDisabled={hasReleaseError || hasTrackError || isSubmitting}
            isLoading={isSubmitting}
            leftIcon={<Icon icon={hasReleaseError || hasTrackError ? faTimes : faCheck} />}
            loadingText="Saving…"
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
