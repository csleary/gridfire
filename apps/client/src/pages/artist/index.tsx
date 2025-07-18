import { Divider, Heading, useColorModeValue, Wrap, WrapItem } from "@chakra-ui/react";
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
  const { artistId, artistSlug } = useParams();
  const dispatch = useDispatch();
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
      <Wrap spacing={8}>
        <WrapItem alignItems="stretch" as="section" flex="1 1 64rem" flexDirection="column" order={[2, 2, 1]}>
          <Releases />
        </WrapItem>
        <WrapItem as="section" flex="0 1 80ch" m={0} order={[1, 1, 2]}>
          <Card alignSelf="stretch" flex={1} m={0}>
            <Follow />
            <Divider borderColor={dividerColor} mb={12} mt={6} />
            <Biography />
            <Divider borderColor={dividerColor} mb={12} mt={6} />
            <Links />
          </Card>
        </WrapItem>
      </Wrap>
    </>
  );
};

export default Artist;
