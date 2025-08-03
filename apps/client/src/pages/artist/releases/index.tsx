import { shallowEqual } from "react-redux";

import RenderRelease from "@/components/renderRelease";
import { useSelector } from "@/hooks";

const imgSizes = `
  (max-width: 479px) calc(100vw - 24px),
  (max-width: 767px) calc(100vw - 2rem),
  (max-width: 1279px) calc((100vw - 4rem)/2),
  (max-width: 1919px) calc((100vw - 6rem)/3),
  640px
`;

const ArtistReleases = () => {
  const releases = useSelector(state => state.releases.artist.releases, shallowEqual);

  return releases.map(release => (
    <RenderRelease imgSizes={imgSizes} key={release._id} release={{ ...release, purchaseId: "" }} showArtist={false} />
  ));
};

export default ArtistReleases;
