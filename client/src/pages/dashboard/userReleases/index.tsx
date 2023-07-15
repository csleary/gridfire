import { Box, Button, Center, Grid, Heading, Text, useColorModeValue } from "@chakra-ui/react";
import { useDispatch, useSelector } from "hooks";
import { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import UserRelease from "./userRelease";
import { faPlusCircle } from "@fortawesome/free-solid-svg-icons";
import { fetchUserReleases } from "state/releases";
import { shallowEqual } from "react-redux";

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
        <Text textAlign="center" mb={8}>
          You don&rsquo;t currently have any releases for sale. Please hit the button below to add your first release.
        </Text>
        <Center>
          <Button
            as={RouterLink}
            colorScheme={addReleaseButtonColor}
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
      <Grid
        as="ul"
        templateColumns={["repeat(auto-fill, minmax(16rem, 1fr))", "repeat(auto-fill, minmax(28rem, 1fr))"]}
        gap={8}
        mb={8}
      >
        {userReleases.map(release => (
          <UserRelease key={release._id} release={release} />
        ))}
      </Grid>
      <Button
        as={RouterLink}
        to={"/release/new"}
        leftIcon={<FontAwesomeIcon icon={faPlusCircle} />}
        title="Add Release"
      >
        Add Release
      </Button>
    </Box>
  );
}

export default UserReleases;
