import { Heading } from "@chakra-ui/react";
import { shallowEqual } from "react-redux";

import Grid from "@/components/grid";
import RenderRelease from "@/components/renderRelease";
import { useSelector } from "@/hooks";

const imgSizes = `(max-width: 959px) calc(100vw - 2rem),
                  (max-width: 1439px) calc((100vw - 4rem)/2),
                  (max-width: 1777px) calc((100vw - 6rem)/3),
                  960px`;

const ArtistReleases = () => {
  const releases = useSelector(state => state.releases.artist.releases, shallowEqual);
  const releaseCount = releases.length;

  return (
    <>
      <Heading as="h3">
        {releaseCount} Release{releaseCount > 1 ? "s" : ""}
      </Heading>
      <Grid>
        {releases.map(release => (
          <RenderRelease
            imgSizes={imgSizes}
            key={release._id}
            release={{ ...release, purchaseId: "" }}
            showArtist={false}
          />
        ))}
      </Grid>
    </>
  );
};

export default ArtistReleases;
