import { Box, Button, Center, Grid, Heading, Text } from "@chakra-ui/react";
import { fetchUserReleases, fetchUserReleasesFavCounts, fetchUserReleasesPlayCounts } from "features/releases";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import UserRelease from "./userRelease";
import axios from "axios";
import { faPlusCircle } from "@fortawesome/free-solid-svg-icons";

function UserReleases() {
  const dispatch = useDispatch();
  const { userReleases, favCounts, playCounts } = useSelector(state => state.releases, shallowEqual);
  const [isLoading, setLoading] = useState(false);
  const [salesData, setSalesData] = useState([]);
  const offlineCount = userReleases.filter(release => release.published === false).length;

  useEffect(() => {
    axios.get("/api/user/sales").then(res => setSalesData(res.data));
  }, []);

  useEffect(() => {
    if (!userReleases.length) setLoading(true);
  }, []); // eslint-disable-line

  useEffect(() => {
    dispatch(fetchUserReleases()).then(() => setLoading(false));
  }, []); // eslint-disable-line

  useEffect(() => {
    if (!userReleases.length) return;
    dispatch(fetchUserReleasesFavCounts());
    dispatch(fetchUserReleasesPlayCounts());
  }, [userReleases.length]); // eslint-disable-line

  if (!userReleases.length) {
    return (
      <Box as="main">
        <Heading as="h3">Add your first release</Heading>
        <Text textAlign="center" mb={8}>
          You don&rsquo;t currently have any releases for sale. Please hit the button below to add your first release.
        </Text>
        <Center>
          <Button
            as={RouterLink}
            colorScheme="yellow"
            to={"/release/new"}
            leftIcon={<FontAwesomeIcon icon={faPlusCircle} />}
            title="Add Release"
          >
            Add Release
          </Button>
        </Center>
      </Box>
    );
  }

  return (
    <Box as="main">
      <Heading as="h3">
        You have {userReleases.length} release
        {userReleases.length > 1 ? "s" : ""} {offlineCount ? ` (${offlineCount} offline)` : null}
      </Heading>
      <Grid as="ul" templateColumns={"repeat(auto-fill, minmax(28rem, 1fr))"} gap={8} mb={8}>
        {userReleases.map(release => {
          const releaseId = release._id;
          const numSold = salesData.find(({ _id }) => _id === releaseId)?.sum ?? 0;

          return (
            <UserRelease
              key={releaseId}
              numSold={numSold}
              release={release}
              favs={favCounts[releaseId]}
              plays={playCounts[releaseId]}
            />
          );
        })}
      </Grid>
      <Button
        as={RouterLink}
        to={"/release/add/"}
        leftIcon={<FontAwesomeIcon icon={faPlusCircle} />}
        title="Add Release"
      >
        Add Release
      </Button>
    </Box>
  );
}

export default UserReleases;
