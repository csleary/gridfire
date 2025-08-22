import { Box, Grid, Heading } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { shallowEqual } from "react-redux";
import { useParams } from "react-router-dom";

import Card from "@/components/card";
import Follow from "@/components/follow";
import { useDispatch, useSelector } from "@/hooks";
import { fetchArtistCatalogue } from "@/state/releases";

import Biography from "./biography";
import Links from "./links";
import Releases from "./releases";

const Artist = () => {
  const dispatch = useDispatch();
  const { artistId, artistSlug } = useParams();
  const name = useSelector(state => state.releases.artist.name, shallowEqual);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    dispatch(fetchArtistCatalogue(artistId, artistSlug)).finally(() => setLoading(false));
  }, [artistId, artistSlug, dispatch]);

  return (
    <>
      <Helmet>
        <title>{isLoading ? "Loading…" : name}</title>
        <meta content={`Music by ${name}.`} name="description" />
      </Helmet>
      <Grid
        alignItems="stretch"
        gap={{ "3xl": 8, base: 6, xl: 6 }}
        templateColumns={{
          "2xl": "repeat(3, 1fr)",
          "3xl": "repeat(4, 1fr)",
          base: "1fr",
          md: "repeat(2, 1fr)",
          xl: "repeat(3, 1fr)"
        }}
      >
        <Heading as="h2" gridColumn={{ base: "1/-1", xl: "2/-2" }} gridRow={{ base: "1" }} m={0}>
          {name}
        </Heading>
        <Follow gridColumn={{ base: "1", xl: "-2/-1" }} gridRow={{ base: "2", xl: "1" }} justifySelf={{ xl: "end" }} />
        <Box aria-hidden="true" display={{ base: "none", xl: "block" }} gridColumn={{ xl: 1 }} gridRow="1" />
        <Releases />
        <Card
          // https://stackoverflow.com/questions/43352501/css-grid-content-to-use-free-space-but-scroll-when-bigger/47421254
          gridColumn={{ base: "1", md: "-2/-1" }}
          gridRow={{ base: "3", md: "2/span 2" }}
          height={{ base: "unset", md: 0 }}
          m={0}
          minHeight="100%"
          overflowY="auto"
        >
          <Biography />
        </Card>
        <Card flex="1" m={0}>
          <Links />
        </Card>
      </Grid>
    </>
  );
};

export default Artist;
