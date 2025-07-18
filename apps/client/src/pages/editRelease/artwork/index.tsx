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
  useColorModeValue
} from "@chakra-ui/react";
import { faThumbsUp, faTimesCircle, faTrashAlt } from "@fortawesome/free-regular-svg-icons";
import { faUpload } from "@fortawesome/free-solid-svg-icons";
import mime from "mime";
import { MouseEvent, useEffect, useRef, useState } from "react";
import { FileRejection, useDropzone } from "react-dropzone";

import Icon from "@/components/icon";
import { useDispatch, useSelector } from "@/hooks";
import { deleteArtwork, uploadArtwork } from "@/state/artwork";
import { toastError, toastSuccess, toastWarning } from "@/state/toast";

const VITE_CDN_IMG = import.meta.env.VITE_CDN_IMG;

interface AcceptedFileTypes {
  [key: string]: string[];
}

const acceptedFileTypes = [".gif", ".jpg", ".jpeg", ".png"].reduce((prev, ext) => {
  const type = mime.getType(ext);
  if (!type) return prev;
  return { ...prev, [type]: [...(prev[type] || []), ext] };
}, {} as AcceptedFileTypes);

const Artwork = () => {
  const dispatch = useDispatch();
  const artworkFile = useRef("");
  const artworkUploading = useSelector(state => state.artwork.artworkUploading);
  const artworkUploadProgress = useSelector(state => state.artwork.artworkUploadProgress);
  const published = useSelector(state => state.editor.release.published);
  const releaseId = useSelector(state => state.editor.release._id);
  const releaseTitle = useSelector(state => state.editor.release.releaseTitle);
  const status = useSelector(state => state.editor.release.artwork.status);
  const [coverArtPreview, setCoverArtPreview] = useState("");
  const [artworkIsLoaded, setArtworkIsLoaded] = useState(false);
  const isStored = status === "stored";

  useEffect(() => {
    if (isStored) return setCoverArtPreview(`${VITE_CDN_IMG}/${releaseId}`);
    setCoverArtPreview("");

    return () => {
      if (artworkFile.current) window.URL.revokeObjectURL(artworkFile.current);
    };
  }, [isStored, releaseId]);

  const onDrop = (accepted: File[], rejected: FileRejection[]) => {
    if (rejected.length) {
      return dispatch(
        toastError({
          message:
            "Upload rejected. Might be too large or formatted incorrectly. Needs to be a jpg or png under 20MB in size.",
          title: "Image rejected"
        })
      );
    }

    const [file] = accepted;
    artworkFile.current = window.URL.createObjectURL(file);
    const image = new Image();
    image.src = artworkFile.current;

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
      dispatch(uploadArtwork(releaseId, file));
    };
  };

  const { getInputProps, getRootProps, isDragAccept, isDragReject } = useDropzone({
    accept: acceptedFileTypes,
    disabled: artworkUploading,
    maxSize: 1024 * 1024 * 20,
    multiple: false,
    noDragEventsBubbling: true,
    noKeyboard: true,
    onDrop
  });

  const handleDeleteArtwork = async (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    let prevPublished = "";
    if (published) prevPublished = " As your release was previously published, it has also been taken offline.";
    dispatch(toastWarning({ message: "Deleting artwork…", title: "Delete" }));
    await dispatch(deleteArtwork(releaseId));
    setCoverArtPreview("");
    dispatch(toastSuccess({ message: `Artwork deleted.${prevPublished}`, title: "Done!" }));
  };

  const trackColor = useColorModeValue("gray.300", "gray.600");

  return (
    <Container maxW="container.sm" p={0}>
      <Heading as="h3">Artwork</Heading>
      <Square
        {...getRootProps()}
        _after={{ content: '""', paddingBottom: "100%" }}
        _hover={{
          backgroundColor: useColorModeValue("white", "black"),
          borderColor: useColorModeValue("green.400", "purple.300"),
          cursor: "pointer"
        }}
        bg={useColorModeValue("white", "gray.800")}
        borderColor={useColorModeValue("gray.400", isDragAccept ? "purple.400" : isDragReject ? "red" : "gray.600")}
        borderStyle="dashed"
        borderWidth="2px"
        fontWeight={500}
        minH={48}
        overflow="hidden"
        position="relative"
        role="group"
        rounded="md"
        transition="0.5s cubic-bezier(0.2, 0.8, 0.4, 1)"
      >
        <input {...getInputProps()} />
        {coverArtPreview ? (
          <Fade in={artworkIsLoaded}>
            <Img
              alt={`The cover art for ${(releaseTitle && `'${releaseTitle}'`) || "this release."}`}
              bottom={0}
              left={0}
              onLoad={() => setArtworkIsLoaded(true)}
              position="absolute"
              right={0}
              src={coverArtPreview}
              top={0}
            />
          </Fade>
        ) : null}
        <Box
          background={artworkUploading ? "rgb(0 0 0 / 75%)" : "rgb(0 0 0 / 0%)"}
          bottom={0}
          left={0}
          position="absolute"
          right={0}
          top={0}
          transition="background 0.5s cubic-bezier(0.2, 0.8, 0.4, 1)"
        >
          <Center height="100%" padding={8}>
            {artworkUploading ? (
              <CircularProgress
                color="blue.200"
                size="4rem"
                thickness=".75rem"
                trackColor={trackColor}
                value={artworkUploadProgress}
              >
                <CircularProgressLabel
                  color={artworkUploading ? "blue.200" : "gray.600"}
                  transition="color 0.5s cubic-bezier(0.2, 0.8, 0.4, 1)"
                >
                  {artworkUploadProgress || 0}%
                </CircularProgressLabel>
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
            _groupHover={{ opacity: 1, visibility: "visible" }}
            aria-label="Delete artwork"
            colorScheme="red"
            icon={<Icon icon={faTrashAlt} />}
            onClick={handleDeleteArtwork}
            opacity={0}
            position="absolute"
            right={12}
            size="lg"
            title="Delete the artwork (will take your release offline)."
            top={12}
            transition="0.25s cubic-bezier(0.2, 0.8, 0.4, 1)"
            visibility="hidden"
          />
        ) : null}
      </Square>
    </Container>
  );
};

export default Artwork;
