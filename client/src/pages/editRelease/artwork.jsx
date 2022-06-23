import {
  Box,
  Center,
  CircularProgress,
  CircularProgressLabel,
  Container,
  Fade,
  Heading,
  IconButton,
  Image as Img,
  Square,
  Text,
  Tooltip,
  useColorModeValue
} from "@chakra-ui/react";
import { deleteArtwork, uploadArtwork } from "state/artwork";
import { faTimesCircle, faThumbsUp, faTrashAlt } from "@fortawesome/free-regular-svg-icons";
import { memo, useEffect, useRef, useState } from "react";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import { toastError, toastSuccess, toastWarning } from "state/toast";
import { CLOUD_URL } from "index";
import Icon from "components/icon";
import { faUpload } from "@fortawesome/free-solid-svg-icons";
import mime from "mime";
import { useDropzone } from "react-dropzone";

const acceptedFileTypes = [".gif", ".jpg", ".jpeg", ".png"].reduce(
  (prev, ext) => ({ ...prev, [mime.getType(ext)]: [...(prev[mime.getType(ext)] || []), ext] }),
  {}
);

const Artwork = () => {
  const dispatch = useDispatch();
  const artworkFile = useRef();

  const {
    _id: releaseId,
    artwork,
    published,
    releaseTitle
  } = useSelector(state => state.releases.activeRelease, shallowEqual);

  const { artworkUploading, artworkUploadProgress } = useSelector(state => state.artwork, shallowEqual);
  const [coverArtPreview, setCoverArtPreview] = useState();
  const [artworkIsLoaded, setArtworkIsLoaded] = useState(false);
  const { cid } = artwork || {};
  const isStored = artwork?.status === "stored";

  useEffect(() => {
    if (isStored) return setCoverArtPreview(`${CLOUD_URL}/${cid}`);
    setCoverArtPreview();

    return () => {
      if (artworkFile.current) window.URL.revokeObjectURL(artworkFile.current.preview);
    };
  }, [cid, isStored, releaseId]);

  const onDrop = (accepted, rejected) => {
    if (rejected.length) {
      return dispatch(
        toastError({
          message:
            "Upload rejected. Might be too large or formatted incorrectly. Needs to be a jpg or png under 20MB in size.",
          title: "Image rejected"
        })
      );
    }

    artworkFile.current = accepted[0];
    const image = new Image();
    image.src = window.URL.createObjectURL(artworkFile.current);

    image.onload = () => {
      const height = image.height;
      const width = image.width;

      if (height < 1000 || width < 1000) {
        return dispatch(
          toastError({
            message: `Sorry, but your image must be at least 1000 pixels high and wide (this seems to be ${width}px by ${height}px). Please edit and re-upload.`,
            title: "Image rejected"
          })
        );
      }

      setCoverArtPreview(image.src);
      dispatch(uploadArtwork(releaseId, artworkFile.current));
    };
  };

  const { getRootProps, getInputProps, isDragAccept, isDragReject } = useDropzone({
    accept: acceptedFileTypes,
    disabled: artworkUploading,
    maxSize: 1024 * 1024 * 20,
    multiple: false,
    noDragEventsBubbling: true,
    noKeyboard: true,
    onDrop
  });

  const handleDeleteArtwork = async event => {
    event.stopPropagation();
    let prevPublished = "";
    if (published) prevPublished = " As your release was previously published, it has also been taken offline.";
    dispatch(toastWarning({ message: "Deleting artwork…", title: "Delete" }));
    await dispatch(deleteArtwork(releaseId));
    setCoverArtPreview();
    dispatch(toastSuccess({ message: `Artwork deleted.${prevPublished}`, title: "Done!" }));
  };

  const trackColor = useColorModeValue("gray.300", "gray.600");
  const toolTipBg = useColorModeValue("gray.200", "gray.800");
  const toolTipColor = useColorModeValue("gray.800", "gray.100");

  return (
    <Container maxW="container.sm" p={0}>
      <Heading as="h3">Artwork</Heading>
      <Square
        {...getRootProps()}
        borderWidth="2px"
        borderStyle="dashed"
        borderColor={useColorModeValue("gray.400", isDragAccept ? "purple.400" : isDragReject ? "red" : "gray.600")}
        bg={useColorModeValue("white", "gray.800")}
        fontWeight={500}
        minH={48}
        overflow="hidden"
        position="relative"
        role="group"
        rounded="md"
        transition="0.5s cubic-bezier(0.2, 0.8, 0.4, 1)"
        _after={{ content: '""', paddingBottom: "100%" }}
        _hover={{ bg: useColorModeValue("gray.100", "black"), cursor: "pointer" }}
      >
        <input {...getInputProps()} />
        {coverArtPreview ? (
          <Fade in={artworkIsLoaded}>
            <Img
              alt={`The cover art for ${(releaseTitle && `\u2018${releaseTitle}\u2019`) || "this release."}`}
              onLoad={() => setArtworkIsLoaded(true)}
              src={coverArtPreview}
              position="absolute"
              bottom={0}
              left={0}
              right={0}
              top={0}
            />
          </Fade>
        ) : null}
        <Box
          bottom={0}
          left={0}
          right={0}
          top={0}
          transition="background 0.5s cubic-bezier(0.2, 0.8, 0.4, 1)"
          background={artworkUploading ? "rgb(0 0 0 / 75%)" : "rgb(0 0 0 / 0%)"}
          position="absolute"
        >
          <Center height="100%" padding={8}>
            {artworkUploading ? (
              <CircularProgress
                trackColor={trackColor}
                color="blue.200"
                size="4rem"
                thickness=".75rem"
                value={artworkUploadProgress}
              >
                <Tooltip hasArrow openDelay={500} bg={toolTipBg} color={toolTipColor}>
                  <CircularProgressLabel
                    color={artworkUploading ? "blue.200" : "gray.600"}
                    transition="color 0.5s cubic-bezier(0.2, 0.8, 0.4, 1)"
                  >
                    {artworkUploadProgress || 0}%
                  </CircularProgressLabel>
                </Tooltip>
              </CircularProgress>
            ) : !coverArtPreview && isDragReject ? (
              <Text textAlign="center">
                <Icon icon={faTimesCircle} mr={2} />
                Sorry, we don&lsquo;t accept that file type. Please ensure it is a png or jpg image file.
              </Text>
            ) : !coverArtPreview && isDragAccept ? (
              <Text textAlign="center">
                <Icon icon={faThumbsUp} mr={2} />
                Drop to upload!
              </Text>
            ) : !coverArtPreview ? (
              <Text textAlign="center">
                <Icon icon={faUpload} mr={2} />
                Drop artwork here, or click to select. Must be under 20MB in size and have a minimum dimension of 1000px
                (will be resized and cropped square).
              </Text>
            ) : null}
          </Center>
        </Box>
        {coverArtPreview ? (
          <IconButton
            colorScheme="red"
            icon={<Icon icon={faTrashAlt} />}
            onClick={handleDeleteArtwork}
            title="Delete the artwork (will take your track offline)."
            opacity={0}
            position="absolute"
            right={12}
            top={12}
            transition="0.25s cubic-bezier(0.2, 0.8, 0.4, 1)"
            size="lg"
            visibility="hidden"
            _groupHover={{ opacity: 1, visibility: "visible" }}
          />
        ) : null}
      </Square>
    </Container>
  );
};

export default memo(Artwork);
