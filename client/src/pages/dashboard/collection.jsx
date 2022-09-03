import { Box, Heading } from "@chakra-ui/react";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import Grid from "components/grid";
import RenderRelease from "components/renderRelease";
import { fetchCollection } from "state/releases";

const Collection = () => {
  const dispatch = useDispatch();
  const { collection = {} } = useSelector(state => state.releases, shallowEqual);
  const { albums = [], singles = [] } = collection;
  const [isLoading, setLoading] = useState(false);
  const available = [...albums, ...singles].filter(({ release }) => Boolean(release));

  useEffect(() => {
    if (!available.length) setLoading(true);
  }, []); // eslint-disable-line

  useEffect(() => {
    dispatch(fetchCollection()).then(() => setLoading(false));
  }, []); // eslint-disable-line

  return (
    <Box as={"main"} flexGrow={1}>
      <Heading as="h3">
        Your Collection ({available.length} release{available.length === 1 ? "" : "s"})
      </Heading>
      {albums.length ? (
        <>
          <Heading as="h3">Albums</Heading>
          <Grid>
            {albums.map(({ _id: purchaseId, purchaseDate, release }) => (
              <RenderRelease key={purchaseId} release={{ ...release, purchaseDate, purchaseId }} type="collection" />
            ))}
          </Grid>
        </>
      ) : null}
      {singles.length ? (
        <>
          <Heading as="h3">Singles</Heading>
          <Grid>
            {singles.map(({ _id: purchaseId, release, purchaseDate, trackId }) => {
              const single = release.trackList.find(({ _id }) => _id === trackId);

              return (
                <RenderRelease
                  key={purchaseId}
                  release={{
                    ...release,
                    purchaseDate,
                    releaseTitle: `${single.trackTitle} (taken from \u2018${release.releaseTitle}\u2019)`,
                    purchaseId
                  }}
                  type="collection"
                />
              );
            })}
          </Grid>
        </>
      ) : null}
    </Box>
  );
};

export default Collection;
