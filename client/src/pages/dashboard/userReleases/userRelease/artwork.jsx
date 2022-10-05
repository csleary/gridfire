import { Fade, Image, Link, chakra, useDisclosure } from "@chakra-ui/react";
import { CLOUD_URL } from "index";
import { Link as RouterLink } from "react-router-dom";
import PropTypes from "prop-types";
import placeholder from "placeholder.svg";

const Artwork = ({ artwork, releaseId, releaseTitle }) => {
  const { isOpen, onOpen } = useDisclosure(false);
  const isStored = artwork.status === "stored";
  const { cid } = artwork;

  return (
    <Fade in={isOpen}>
      <Link as={RouterLink} to={`/release/${releaseId}`} display="block" pt="100%" position="relative">
        <Image
          to={`/release/${releaseId}`}
          alt={isStored ? `\u2018${releaseTitle}\u2019 artwork.` : "No artwork uploaded."}
          fallbackSrc={placeholder}
          inset={0}
          loading="lazy"
          objectFit="cover"
          onLoad={onOpen}
          onError={onOpen}
          position="absolute"
          src={isStored ? `${CLOUD_URL}/${cid}` : placeholder}
        />
      </Link>
    </Fade>
  );
};

Artwork.propTypes = {
  artwork: PropTypes.object,
  releaseId: PropTypes.string,
  releaseTitle: PropTypes.string
};

export default chakra(Artwork);
