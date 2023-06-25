import { Box, Divider, Heading, Link, Text, VStack, Wrap, WrapItem, useColorModeValue } from "@chakra-ui/react";
import { useDispatch, useSelector } from "hooks";
import { useEffect, useState } from "react";
import Card from "components/card";
import Follow from "components/follow";
import Grid from "components/grid";
import { Helmet } from "react-helmet";
import RenderRelease from "components/renderRelease";
import { fetchArtistCatalogue } from "state/releases";
import { shallowEqual } from "react-redux";
import { useParams } from "react-router-dom";

const Artist = () => {
  const { artistId, artistSlug } = useParams();
  const dispatch = useDispatch();
  const { biography, links, name, releases } = useSelector(state => state.releases.artist, shallowEqual);
  const [isLoading, setLoading] = useState(false);
  const releaseCount = releases?.length ?? 0;
  const dividerColor = useColorModeValue("gray.200", "gray.500");

  useEffect(() => {
    if (!releaseCount) setLoading(true);
  }, []); // eslint-disable-line

  useEffect(() => {
    dispatch(fetchArtistCatalogue(artistId, artistSlug)).then(() => setLoading(false));
  }, [artistId, artistSlug]); // eslint-disable-line

  return (
    <>
      <Helmet>
        <title>{isLoading ? "Loading…" : name}</title>
        <meta name="description" content={`Listen to ${releaseCount} releases by ${name}.`} />
      </Helmet>
      <Heading as="h2">{name}</Heading>
      <Follow />
      <Wrap spacing={8}>
        <WrapItem as="section" alignItems="stretch" flex="1 1 64rem" flexDirection="column" order={[2, 2, 1]}>
          <Heading as="h3">
            {releaseCount} Release{releaseCount > 1 ? "s" : ""}
          </Heading>
          <Grid>
            {releases?.map(release => (
              <RenderRelease key={release._id} showArtist={false} release={{ ...release, purchaseId: "" }} />
            ))}
          </Grid>
        </WrapItem>
        {biography || links?.length ? (
          <WrapItem as="section" flex="0 1 80ch" m={0} order={[1, 1, 2]}>
            <Card alignSelf="stretch" flex={1} m={0}>
              {biography ? (
                <>
                  <Heading as="h3">Biography</Heading>
                  <Box mb={8}>
                    {biography
                      .split("\n")
                      .filter(text => text.trim().length)
                      .map((paragraph, index) => (
                        <Text mb={6} key={index}>
                          {paragraph}
                        </Text>
                      ))}
                  </Box>
                </>
              ) : null}
              {links?.length ? (
                <>
                  {biography ? <Divider borderColor={dividerColor} mb={6} /> : null}
                  <Box>
                    <Heading as="h3">Links</Heading>
                    <VStack as="ul" alignItems="flex-start" listStyleType="none">
                      {links.map(({ title, uri }) => (
                        <Box as="li" key={uri}>
                          <Link href={uri} rel="nofollow noopener">
                            {title}
                          </Link>
                        </Box>
                      ))}
                    </VStack>
                  </Box>
                </>
              ) : null}
            </Card>
          </WrapItem>
        ) : null}
      </Wrap>
    </>
  );
};

export default Artist;
