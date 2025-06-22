import { Fade, Image, Link, chakra, useDisclosure } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import placeholder from "placeholder.svg";
import { setIsLoading } from "state/releases";
import { useDispatch } from "react-redux";

const { REACT_APP_CDN_IMG } = process.env;

interface Props {
  artwork: {
    status: string;
  };
  releaseId: string;
  releaseTitle: string;
}

const Artwork = ({ artwork, releaseId, releaseTitle }: Props) => {
  const { isOpen, onOpen } = useDisclosure();
  const dispatch = useDispatch();
  const isStored = artwork.status === "stored";
  const handleClickNavigate = () => dispatch(setIsLoading(true));

  return (
    <Fade in={isOpen}>
      <Link as={RouterLink} to={`/release/${releaseId}`} display="block" pt="100%" position="relative">
        <Image
          alt={isStored ? `\u2018${releaseTitle}\u2019 artwork.` : "No artwork uploaded."}
          fallbackSrc={placeholder}
          inset={0}
          loading="lazy"
          objectFit="cover"
          onClick={handleClickNavigate}
          onLoad={onOpen}
          onError={onOpen}
          position="absolute"
          src={isStored ? `${REACT_APP_CDN_IMG}/${releaseId}` : placeholder}
        />
      </Link>
    </Fade>
  );
};

export default chakra(Artwork);
