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
          rel="preconnect"
          {...(isStored
            ? {
                sizes: `(max-width: 959px) calc(100vw - 2rem),
                          (max-width: 1439px) calc((100vw - 4rem)/2),
                          (max-width: 1919px) calc((100vw - 6rem)/3),
                          (max-width: 2399px) calc((100vw - 8rem)/4),
                          640px`,
                src: `${VITE_CDN_IMG}/${releaseId}/1024w.webp`,
                srcSet: `${VITE_CDN_IMG}/${releaseId}/320w.webp 320w,
                           ${VITE_CDN_IMG}/${releaseId}/640w.webp 640w,
                           ${VITE_CDN_IMG}/${releaseId}/960w.webp 960w,
                           ${VITE_CDN_IMG}/${releaseId}/1024w.webp 1024w,
                           ${VITE_CDN_IMG}/${releaseId}/1440w.webp 1440w,
                           ${VITE_CDN_IMG}/${releaseId}/1920w.webp 1920w,
                           ${VITE_CDN_IMG}/${releaseId}/2560w.webp 2560w`
              }
            : { src: placeholder })}
        />
      </Link>
    </Fade>
  );
};

export default chakra(Artwork);
