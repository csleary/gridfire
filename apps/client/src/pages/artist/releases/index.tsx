import { Heading } from "@chakra-ui/react";
import { shallowEqual } from "react-redux";

import Grid from "@/components/grid";
import RenderRelease from "@/components/renderRelease";
import { useSelector } from "@/hooks";

const Artist = () => {
  const releases = useSelector(state => state.releases.artist.releases, shallowEqual);
  const releaseCount = releases.length;

  return (
    <>
      <Heading as="h3">
        {releaseCount} Release{releaseCount > 1 ? "s" : ""}
      </Heading>
      <Grid>
        {releases.map(release => (
          <RenderRelease key={release._id} release={{ ...release, purchaseId: "" }} showArtist={false} />
        ))}
      </Grid>
    </>
  );
};

export default Artist;
