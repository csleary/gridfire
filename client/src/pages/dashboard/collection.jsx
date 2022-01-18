import { Box, Grid, Heading } from "@chakra-ui/react";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import RenderRelease from "components/renderRelease";
import { fetchCollection } from "features/releases";

const Collection = () => {
  const dispatch = useDispatch();
  const { collection } = useSelector(state => state.releases, shallowEqual);
  const [isLoading, setLoading] = useState(false);

  useEffect(() => {
    if (!collection.length) setLoading(true);
  }, []); // eslint-disable-line

  useEffect(() => {
    dispatch(fetchCollection()).then(() => setLoading(false));
  }, []); // eslint-disable-line

  return (
    <Box as={"main"} flexGrow={1}>
      <Heading as="h3">
        Your Collection ({collection.length} release{collection.length === 1 ? "" : "s"})
      </Heading>
      <Grid templateColumns={"repeat(auto-fill, minmax(28rem, 1fr))"} gap={8}>
        {collection.map(({ release }) => (
          <RenderRelease key={release._id} release={release} type="collection" />
        ))}
      </Grid>
    </Box>
  );
};

export default Collection;
