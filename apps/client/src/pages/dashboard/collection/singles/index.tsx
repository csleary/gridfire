import { Box, Heading } from "@chakra-ui/react";
import { useDispatch, useSelector } from "hooks";
import { useState, useEffect } from "react";
import Grid from "components/grid";
import RenderRelease from "components/renderRelease";
import { fetchUserSingles } from "state/releases";
import { shallowEqual } from "react-redux";

const Singles = () => {
  const dispatch = useDispatch();
  const singles = useSelector(state => state.releases.userSingles, shallowEqual);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    dispatch(fetchUserSingles()).finally(() => setLoading(false));
  }, [dispatch]);

  if (singles.length) {
    return (
      <>
        <Heading as="h3" mt={8}>
          Singles
        </Heading>
        <Grid>
          {singles.map(({ _id, release, trackId }) => {
            const single = release.trackList.find(({ _id }) => _id === trackId);

            return (
              <Box key={_id}>
                <RenderRelease
                  release={{
                    ...release,
                    releaseTitle: `${single?.trackTitle ?? ""} (taken from '${release.releaseTitle}')`
                  }}
                  type="collection"
                  mb={2}
                />
              </Box>
            );
          })}
        </Grid>
      </>
    );
  }

  return null;
};

export default Singles;
