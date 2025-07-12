import { chakra, Fade, Image, Link, useDisclosure } from "@chakra-ui/react";
import { useDispatch } from "react-redux";
import { Link as RouterLink } from "react-router-dom";

import placeholder from "@/placeholder.svg";
import { setIsLoading } from "@/state/releases";

const VITE_CDN_IMG = import.meta.env.VITE_CDN_IMG;

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
      <Link as={RouterLink} display="block" position="relative" pt="100%" to={`/release/${releaseId}`}>
        <Image
          alt={isStored ? `'${releaseTitle}' artwork.` : "No artwork uploaded."}
          fallbackSrc={placeholder}
          inset={0}
          loading="lazy"
          objectFit="cover"
          onClick={handleClickNavigate}
          onError={onOpen}
          onLoad={onOpen}
          position="absolute"
          src={isStored ? `${VITE_CDN_IMG}/${releaseId}` : placeholder}
        />
      </Link>
    </Fade>
  );
};

export default chakra(Artwork);
