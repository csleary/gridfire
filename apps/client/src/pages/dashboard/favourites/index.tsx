import { Box, Heading } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { shallowEqual } from "react-redux";

import Grid from "@/components/grid";
import RenderRelease from "@/components/renderRelease";
import { useDispatch, useSelector } from "@/hooks";
import { fetchUserFavourites } from "@/state/releases";

const Favourites = () => {
  const dispatch = useDispatch();
  const userFavourites = useSelector(state => state.releases.userFavourites, shallowEqual);
  const [isLoading, setLoading] = useState(false);

  useEffect(() => {
    if (!userFavourites.length) setLoading(true);
  }, []); // eslint-disable-line

  useEffect(() => {
    dispatch(fetchUserFavourites()).then(() => setLoading(false));
  }, []); // eslint-disable-line

  return (
    <Box as={"main"} flexGrow={1}>
      <Heading as="h3">Favourites</Heading>
      <Grid>
        {userFavourites.map(({ _id: favouriteId, release }) => (
          <RenderRelease key={favouriteId} release={release} />
        ))}
      </Grid>
    </Box>
  );
};

export default Favourites;
