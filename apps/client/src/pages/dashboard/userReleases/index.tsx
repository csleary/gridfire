import type { UserRelease } from "@gridfire/shared/types";

import { Box, Button, Center, Grid, Heading, Skeleton, Text, useColorModeValue } from "@chakra-ui/react";
import { faPlusCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { lazy, useEffect, useState } from "react";
import { shallowEqual } from "react-redux";
import { Link as RouterLink } from "react-router-dom";

import { useDispatch, useSelector } from "@/hooks";
import { fetchUserReleases } from "@/state/releases";
const UserRelease = lazy(() => import("./userRelease"));

const placeholderRelease = {
  _id: "",
  artist: "",
  artistName: "",
  artwork: { status: "" },
  releaseTitle: "",
  trackList: []
} as unknown as UserRelease;

const placeholderReleases: UserRelease[] = Array.from({ length: 5 }, () => placeholderRelease).map(
  (release, index) => ({ ...release, _id: index.toString() })
);

function UserReleases() {
  const addReleaseButtonColor = useColorModeValue("yellow", "purple");
  const dispatch = useDispatch();
  const userReleases = useSelector(state => state.releases.userReleases, shallowEqual);
  const [isLoading, setLoading] = useState(false);
  const offlineCount = userReleases.filter(release => release.published === false).length;
  const releases = isLoading ? placeholderReleases : userReleases;

  useEffect(() => {
    if (!userReleases.length) setLoading(true);
  }, [userReleases.length]);

  useEffect(() => {
    dispatch(fetchUserReleases()).then(() => setLoading(false));
  }, [dispatch]);

  return (
    <Box as="main">
      <Skeleton isLoaded={!isLoading}>
        <Heading as="h3">
          {!userReleases.length ? (
            <>Add your first release</>
          ) : (
            <>
              You have {userReleases.length} release
              {userReleases.length > 1 ? "s" : ""} {offlineCount ? ` (${offlineCount} offline)` : null}
            </>
          )}
        </Heading>
      </Skeleton>
      <Skeleton isLoaded={!isLoading}>
        {!isLoading && userReleases.length === 0 && (
          <>
            <Text mb={8} textAlign="center">
              You don&rsquo;t currently have any releases for sale. Please hit the button below to add your first
              release.
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
          </>
        )}
      </Skeleton>
      <Grid
        as="ul"
        gap={8}
        mb={8}
        templateColumns={["repeat(auto-fill, minmax(16rem, 1fr))", "repeat(auto-fill, minmax(28rem, 1fr))"]}
      >
        {releases.map(release => (
          <Skeleton isLoaded={!isLoading} key={release._id}>
            <UserRelease key={release._id} release={release} />
          </Skeleton>
        ))}
      </Grid>
      {userReleases.length > 0 && (
        <Button
          as={RouterLink}
          leftIcon={<FontAwesomeIcon icon={faPlusCircle} />}
          title="Add Release"
          to={"/release/new"}
        >
          Add Release
        </Button>
      )}
    </Box>
  );
}

export default UserReleases;
