import Grid from "@/components/grid";
import RenderRelease from "@/components/renderRelease";
import { useDispatch, useSelector } from "@/hooks";
import { fetchUserEditions } from "@/state/releases";
import { Box, Heading } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { shallowEqual } from "react-redux";

const Editions = () => {
  const dispatch = useDispatch();
  const userEditions = useSelector(state => state.releases.userEditions, shallowEqual);
  const userId = useSelector(state => state.user.userId);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      dispatch(fetchUserEditions()).finally(() => setLoading(false));
    }
  }, [dispatch, userId]);

  if (userEditions.length) {
    return (
      <>
        <Heading as="h3">Gridfire Editions</Heading>
        <Grid>
          {userEditions.map(({ _id, metadata, release }) => {
            const { description } = metadata || {};
            const releaseTitle = description || release.releaseTitle;

            return (
              <Box key={_id}>
                <RenderRelease release={{ ...release, releaseTitle }} type="collection" mb={2} />
              </Box>
            );
          })}
        </Grid>
      </>
    );
  }
};

export default Editions;
