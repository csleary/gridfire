import { Box, Button, Center, Grid } from "@chakra-ui/react";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
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
  const [currentSortPath, setCurrentSortPath] = useState("createdAt");
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

  const head = (
    <Helmet>
      <title>GridFire</title>
      <meta name="description" content="Listen to the latest releases on GridFire." />
    </Helmet>
  );

  return (
    <>
      {head}
      <Box as="main">
        <SortReleases
          handleFetchCatalogue={handleFetchCatalogue}
          currentSortPath={currentSortPath}
          setCurrentSortPath={setCurrentSortPath}
          currentSortOrder={currentSortOrder}
          setCurrentSortOrder={setCurrentSortOrder}
        />
        <Grid templateColumns="repeat(auto-fill, minmax(28rem, 1fr))" gap={8}>
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
