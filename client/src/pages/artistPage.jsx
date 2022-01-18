import { Box, Flex, Grid, Heading, Link, VStack } from "@chakra-ui/react";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import Card from "components/card";
import { Helmet } from "react-helmet";
import RenderRelease from "components/renderRelease";
import { fetchArtistCatalogue } from "features/releases";
import { useParams } from "react-router-dom";

const ArtistPage = () => {
  const { artistId, artistSlug } = useParams();
  const dispatch = useDispatch();
  const { biography, links, name, releases } = useSelector(state => state.releases.artist, shallowEqual);
  const [isLoading, setLoading] = useState(false);
  const releaseCount = releases?.length;

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
      <Flex flexWrap="wrap">
        <Box as="section" flex="1 1 64rem" mr={8} order={[2, 1]}>
          <Heading as="h3">
            {releaseCount} Release{releaseCount > 1 ? "s" : ""}
          </Heading>
          <Grid templateColumns="repeat(auto-fill, minmax(28rem, 1fr))" gap={8}>
            {releases?.map(release => (
              <RenderRelease key={release._id} showArtist={false} release={release} />
            ))}
          </Grid>
        </Box>
        <Card as="section" flex="1 1 32rem" m={0} order={[1, 2]}>
          {biography ? (
            <>
              <Heading as="h3">Biography</Heading>
              <Box mb={8}>
                {biography
                  .split("\n")
                  .filter(text => text.trim().length)
                  .map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
              </Box>
            </>
          ) : null}
          {links?.length ? (
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
          ) : null}
        </Card>
      </Flex>
    </>
  );
};

export default ArtistPage;
