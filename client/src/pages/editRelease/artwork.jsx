import { Box, Container, Fade, Flex, IconButton, Image as Img, Progress, Square, Text } from "@chakra-ui/react";
import { deleteArtwork, uploadArtwork } from "features/artwork";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import { toastError, toastSuccess, toastWarning } from "features/toast";
import { useEffect, useRef, useState } from "react";
import { CLOUD_URL } from "index";
import Icon from "components/icon";
import { faTimesCircle, faThumbsUp, faTrashAlt } from "@fortawesome/free-regular-svg-icons";
import { faUpload } from "@fortawesome/free-solid-svg-icons";
import { useDropzone } from "react-dropzone";

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
  const artworkStatus = artwork?.status;

  useEffect(() => {
    if (artworkStatus === "stored") return setCoverArtPreview(`${CLOUD_URL}/${releaseId}.jpg`);
    setCoverArtPreview();

    return () => {
      if (artworkFile.current) window.URL.revokeObjectURL(artworkFile.current.preview);
    };
  }, [artworkStatus, releaseId]);

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

  const { acceptedFiles, getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    accept: "image/png, image/jpeg",
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
    dispatch(toastWarning({ message: "Deleting artwork…", title: "Deletion" }));
    await dispatch(deleteArtwork(releaseId));
    setCoverArtPreview();
    dispatch(toastSuccess({ message: `Artwork deleted.${prevPublished}`, title: "Deletion" }));
  };

  return (
    <Container maxW="container.sm" p={0}>
      <Square
        {...getRootProps()}
        borderWidth="2px"
        borderStyle="dashed"
        borderColor="gray.400"
        bg="white"
        fontWeight={500}
        minH={48}
        overflow="hidden"
        position="relative"
        role="group"
        rounded="md"
        transition="0.5s cubic-bezier(0.2, 0.8, 0.4, 1)"
        _after={{ content: '""', paddingBottom: "100%" }}
        _hover={{ cursor: "pointer" }}
        sx={
          isDragActive && !isDragReject
            ? { borderColor: "blue.100" }
            : isDragReject
            ? { borderColor: "red.400" }
            : artworkUploading
            ? { borderColor: "blue.100" }
            : null
        }
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
          <Flex height="100%" alignItems="stretch" flexDirection="column" justifyContent="center" padding={8}>
            {artworkUploading ? (
              <>
                <Text textAlign="center" mb={4} color="blue.100">
                  <Icon fixedWidth icon={faUpload} mr={2} />
                  Uploading &lsquo;{acceptedFiles[0]?.path}&rsquo;: {artworkUploadProgress}%
                </Text>
                <Progress value={artworkUploadProgress} variant="uploading" />
              </>
            ) : !coverArtPreview && isDragReject ? (
              <Text textAlign="center">
                <Icon icon={faTimesCircle} mr={2} />
                Sorry, we don&lsquo;t accept that file type. Please ensure it is a png or jpg image file.
              </Text>
            ) : !coverArtPreview && isDragActive ? (
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
          </Flex>
        </Box>
        {coverArtPreview ? (
          <IconButton
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

export default Artwork;
