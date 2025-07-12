import { Box, Button, Center, Container, Heading, Highlight, Skeleton, useColorModeValue } from "@chakra-ui/react";
import { faArrowDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { lazy, useCallback, useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { shallowEqual } from "react-redux";

import Grid from "@/components/grid";
import RenderRelease from "@/components/renderRelease";
import { useDispatch, useSelector } from "@/hooks";
import { fetchCatalogue } from "@/state/releases";
const SortReleases = lazy(() => import("./sort"));
const Features = lazy(() => import("./features"));

const Home: React.FC = () => {
  const dispatch = useDispatch();
  const catalogue = useSelector(state => state.releases.catalogue, shallowEqual);
  const catalogueLimit = useSelector(state => state.releases.catalogueLimit);
  const catalogueSkip = useSelector(state => state.releases.catalogueSkip);
  const isLoadingUser = useSelector(state => state.user.isLoading);
  const reachedEndOfCat = useSelector(state => state.releases.reachedEndOfCat);
  const userAccount = useSelector(state => state.user.account);
  const [isFetching, setIsFetching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSortPath, setCurrentSortPath] = useState("releaseDate");
  const [currentSortOrder, setCurrentSortOrder] = useState("-1");
  const bgHighlight = useColorModeValue("yellow.400", "purple.200");

  const handleFetchCatalogue = useCallback(
    async ({ isPaging = false, sortBy = currentSortPath, sortOrder = currentSortOrder } = {}) => {
      setIsFetching(true);
      dispatch(fetchCatalogue({ catalogueLimit, catalogueSkip, isPaging, sortBy, sortOrder })).then(() =>
        setIsFetching(false)
      );
    },
    [catalogueLimit, catalogueSkip, dispatch, currentSortOrder, currentSortPath]
  );

  useEffect(() => {
    handleFetchCatalogue().finally(() => setIsLoading(false));
  }, [handleFetchCatalogue]);

  return (
    <>
      <Helmet>
        <title>Gridfire</title>
        <meta content="Listen to the latest releases on Gridfire, a web3 music download store." name="description" />
      </Helmet>
      {isLoadingUser || userAccount ? null : (
        <>
          <Container maxWidth="container.xl" mb={24} mt={12}>
            <Heading lineHeight="tall" m={0}>
              <Highlight
                query={["gridfire", "equitable", "sustainable", "supportive"]}
                styles={{ bg: bgHighlight, px: "2", py: "1", rounded: "full" }}
              >
                Gridfire is a new music streaming and download service, powered by decentralised protocols, to create a
                more equitable, sustainable and supportive creative economy.
              </Highlight>
            </Heading>
          </Container>
          <Features />
        </>
      )}
      <Box as="section">
        <Heading textAlign="left">Recent Releases</Heading>
        <SortReleases
          currentSortOrder={currentSortOrder}
          currentSortPath={currentSortPath}
          handleFetchCatalogue={handleFetchCatalogue}
          setCurrentSortOrder={setCurrentSortOrder}
          setCurrentSortPath={setCurrentSortPath}
        />
        <Grid>
          {catalogue.map(release => (
            <Skeleton isLoaded={!isLoading} key={release._id}>
              <RenderRelease release={release} />
            </Skeleton>
          ))}
        </Grid>
        {!catalogue.length ? null : (
          <Center>
            <Button
              isDisabled={isFetching || reachedEndOfCat}
              leftIcon={<FontAwesomeIcon icon={faArrowDown} />}
              mt={12}
              onClick={() =>
                handleFetchCatalogue({ isPaging: true, sortBy: currentSortPath, sortOrder: currentSortOrder })
              }
              size="sm"
            >
              More
            </Button>
          </Center>
        )}
      </Box>
    </>
  );
};

export default Home;
