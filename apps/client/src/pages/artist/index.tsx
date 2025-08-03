import { Divider, Flex, Grid, Heading, useBreakpointValue, useColorModeValue } from "@chakra-ui/react";
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
  const dividerColor = useColorModeValue("gray.200", "gray.600");
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
      <Heading as="h2">{name}</Heading>
      <Grid
        alignItems="stretch"
        gap={8}
        templateColumns={{
          "2xl": "repeat(3, 1fr)",
          "3xl": "repeat(4, 1fr)",
          base: "1fr",
          md: "repeat(2, 1fr)",
          xl: "repeat(3, 1fr)"
        }}
      >
        <Releases />
        <Card flex="1" gridColumn={{ base: "1/-1", md: "-2/-1" }} gridRow={{ base: "4" }} m={0}>
          <Links />
        </Card>
        <Card
          gridColumn={{ base: "1/-1", md: "-2/-1" }}
          gridRow={{ base: "2", md: "2/span 2" }}
          height={{ base: "unset", md: 0 }}
          m={0}
          minHeight="100%"
          overflowY="auto"
        >
          <Biography />
        </Card>
        <Card
          aspectRatio={1}
          gridColumn={{ base: "1/-1", md: "-2/-1" }}
          gridRow={{ base: "1/1", md: "1" }}
          height={{ base: "unset", md: 0 }}
          m={0}
          minHeight="100%"
          overflowY="auto"
          p={4}
        >
          <Follow />
        </Card>
      </Grid>
    </>
  );
};

export default Artist;
