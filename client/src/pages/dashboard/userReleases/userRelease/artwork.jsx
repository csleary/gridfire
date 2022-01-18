import { Fade, Image, Link, chakra, useDisclosure } from "@chakra-ui/react";
import { CLOUD_URL } from "index";
import { Link as RouterLink } from "react-router-dom";
import PropTypes from "prop-types";
import placeholder from "placeholder.svg";

const Artwork = ({ artwork, releaseId, releaseTitle }) => {
  const { isOpen, onOpen } = useDisclosure(false);
  const isStored = artwork.status === "stored";

  return (
    <Fade in={isOpen}>
      <Link as={RouterLink} to={`/release/${releaseId}`}>
        <Image
          to={`/release/${releaseId}`}
          alt={isStored ? `\u2018${releaseTitle}\u2019 artwork.` : "No artwork uploaded."}
          objectFit="cover"
          onLoad={onOpen}
          onError={onOpen}
          fallbackSrc={placeholder}
          src={isStored ? `${CLOUD_URL}/${releaseId}.jpg` : placeholder}
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
