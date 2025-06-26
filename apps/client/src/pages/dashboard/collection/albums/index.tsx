import Grid from "@/components/grid";
import RenderRelease from "@/components/renderRelease";
import { useDispatch, useSelector } from "@/hooks";
import { fetchUserAlbums } from "@/state/releases";
import { Box, Heading } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { shallowEqual } from "react-redux";

const Albums = () => {
  const dispatch = useDispatch();
  const albums = useSelector(state => state.releases.userAlbums, shallowEqual);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    dispatch(fetchUserAlbums()).finally(() => setLoading(false));
  }, [dispatch]);

  if (albums.length) {
    return (
      <>
        <Heading as="h3">Albums</Heading>
        <Grid>
          {albums.map(({ _id: purchaseId, paid, purchaseDate, release, transactionHash }) => {
            return (
              <Box key={purchaseId}>
                <RenderRelease release={{ ...release, purchaseId }} type="collection" mb={2} />
              </Box>
            );
          })}
        </Grid>
      </>
    );
  }

  return null;
};

export default Albums;
