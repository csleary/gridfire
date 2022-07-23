import { Box, Button, Center, Container, Heading, Highlight, useColorModeValue } from "@chakra-ui/react";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Features from "./features";
import Grid from "components/grid";
import { Helmet } from "react-helmet";
import RenderRelease from "components/renderRelease";
import SortReleases from "./sortReleases";
import { faSync } from "@fortawesome/free-solid-svg-icons";
import { fetchCatalogue } from "state/releases";
import { toastInfo } from "state/toast";

const Home = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { catalogue, catalogueLimit, catalogueSkip, reachedEndOfCat } = useSelector(
    state => state.releases,
    shallowEqual
  );
  const [isFetching, setIsFetching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSortPath, setCurrentSortPath] = useState("releaseDate");
  const [currentSortOrder, setCurrentSortOrder] = useState(-1);
  const { service } = useParams();

  const handleFetchCatalogue = useCallback(
    async ({ sortBy = currentSortPath, sortOrder = currentSortOrder, isPaging = false } = {}) => {
      setIsFetching(true);
      dispatch(fetchCatalogue({ catalogueLimit, catalogueSkip, sortBy, sortOrder, isPaging })).then(() =>
        setIsFetching(false)
      );
    },
    [catalogueLimit, catalogueSkip, dispatch, currentSortOrder, currentSortPath]
  );

  useEffect(() => {
    if (!catalogue.length) setIsLoading(true);
  }, []); // eslint-disable-line

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.has("prev")) return navigate(searchParams.get("prev"));
    handleFetchCatalogue().then(() => setIsLoading(false));
  }, []); // eslint-disable-line

  useEffect(() => {
    if (service) {
      const serviceName = `${service.charAt(0).toUpperCase()}${service.substring(1)}`;
      dispatch(toastInfo({ message: `You are now logged in using your ${serviceName} account.`, title: "Logged in" }));
    }
  }, [service]); // eslint-disable-line

  return (
    <>
      <Helmet>
        <title>GridFire</title>
        <meta name="description" content="Listen to the latest releases on GridFire." />
      </Helmet>
      <Container maxWidth="container.xl" mt={12} mb={24}>
        <Heading lineHeight="tall" m={0}>
          <Highlight
            query={["gridfire", "equitable", "sustainable", "supportive"]}
            styles={{ px: "2", py: "1", rounded: "full", bg: useColorModeValue("yellow.400", "purple.200") }}
          >
            GridFire is a new music streaming and download service, powered by decentralised protocols, to create a more
            equitable, sustainable and supportive creative economy.
          </Highlight>
        </Heading>
      </Container>
      <Features />
      <Box as="section">
        <Heading textAlign="left">Releases</Heading>
        <SortReleases
          handleFetchCatalogue={handleFetchCatalogue}
          currentSortPath={currentSortPath}
          setCurrentSortPath={setCurrentSortPath}
          currentSortOrder={currentSortOrder}
          setCurrentSortOrder={setCurrentSortOrder}
        />
        <Grid>
          {catalogue.map(release => (
            <RenderRelease key={release._id} release={release} />
          ))}
        </Grid>
        {!catalogue.length || reachedEndOfCat ? null : (
          <Center>
            <Button
              disabled={isFetching || reachedEndOfCat}
              leftIcon={reachedEndOfCat ? null : <FontAwesomeIcon icon={faSync} />}
              onClick={() =>
                handleFetchCatalogue({ sortBy: currentSortPath, sortOrder: currentSortOrder, isPaging: true })
              }
              size="sm"
            >
              Load More
            </Button>
          </Center>
        )}
      </Box>
    </>
  );
};

export default Home;
