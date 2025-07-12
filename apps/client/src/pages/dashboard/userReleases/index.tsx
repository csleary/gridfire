import { Box, Button, Center, Grid, Heading, Text, useColorModeValue } from "@chakra-ui/react";
import { faPlusCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { lazy, useEffect, useState } from "react";
import { shallowEqual } from "react-redux";
import { Link as RouterLink } from "react-router-dom";

import { useDispatch, useSelector } from "@/hooks";
import { fetchUserReleases } from "@/state/releases";
const UserRelease = lazy(() => import("./userRelease"));

function UserReleases() {
  const addReleaseButtonColor = useColorModeValue("yellow", "purple");
  const dispatch = useDispatch();
  const userReleases = useSelector(state => state.releases.userReleases, shallowEqual);
  const [isLoading, setLoading] = useState(false);
  const offlineCount = userReleases.filter(release => release.published === false).length;

  useEffect(() => {
    if (!userReleases.length) setLoading(true);
  }, []); // eslint-disable-line

  useEffect(() => {
    dispatch(fetchUserReleases()).then(() => setLoading(false));
  }, []); // eslint-disable-line

  if (!userReleases.length) {
    return (
      <Box as="main">
        <Heading as="h3">Add your first release</Heading>
        <Text mb={8} textAlign="center">
          You don&rsquo;t currently have any releases for sale. Please hit the button below to add your first release.
        </Text>
        <Center>
          <Button
            as={RouterLink}
            colorScheme={addReleaseButtonColor}
            leftIcon={<FontAwesomeIcon icon={faPlusCircle} />}
            title="Add Release"
            to={"/release/new"}
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
      <Grid
        as="ul"
        gap={8}
        mb={8}
        templateColumns={["repeat(auto-fill, minmax(16rem, 1fr))", "repeat(auto-fill, minmax(28rem, 1fr))"]}
      >
        {userReleases.map(release => (
          <UserRelease key={release._id} release={release} />
        ))}
      </Grid>
      <Button
        as={RouterLink}
        leftIcon={<FontAwesomeIcon icon={faPlusCircle} />}
        title="Add Release"
        to={"/release/new"}
      >
        Add Release
      </Button>
    </Box>
  );
}

export default UserReleases;
