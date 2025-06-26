import placeholder from "@/placeholder.svg";
import { setIsLoading } from "@/state/releases";
import { Fade, Image, Link, chakra, useDisclosure } from "@chakra-ui/react";
import { useDispatch } from "react-redux";
import { Link as RouterLink } from "react-router-dom";

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
      <Link as={RouterLink} to={`/release/${releaseId}`} display="block" pt="100%" position="relative">
        <Image
          alt={isStored ? `'${releaseTitle}' artwork.` : "No artwork uploaded."}
          fallbackSrc={placeholder}
          inset={0}
          loading="lazy"
          objectFit="cover"
          onClick={handleClickNavigate}
          onLoad={onOpen}
          onError={onOpen}
          position="absolute"
          src={isStored ? `${VITE_CDN_IMG}/${releaseId}` : placeholder}
        />
      </Link>
    </Fade>
  );
};

export default chakra(Artwork);
