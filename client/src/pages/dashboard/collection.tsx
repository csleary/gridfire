import { Box, Flex, Heading, Link, Text, useColorModeValue } from "@chakra-ui/react";
import { fetchCollection, fetchUserEditions } from "state/releases";
import { useDispatch, useSelector } from "hooks";
import { useEffect, useState } from "react";
import { DateTime } from "luxon";
import Grid from "components/grid";
import Icon from "components/icon";
import RenderRelease from "components/renderRelease";
import { faReceipt } from "@fortawesome/free-solid-svg-icons";
import { formatEther } from "ethers";
import { shallowEqual } from "react-redux";

const Collection = () => {
  const receiptTextColour = useColorModeValue("gray.600", "gray.300");
  const receiptColour = useColorModeValue("blue.200", "blue.100");
  const dispatch = useDispatch();
  const collection = useSelector(state => state.releases.collection, shallowEqual);
  const userEditions = useSelector(state => state.releases.userEditions, shallowEqual);
  const userId = useSelector(state => state.user.userId);
  const [isLoading, setLoading] = useState(false);
  const { albums, singles } = collection;
  const available = [...albums, ...singles, ...userEditions].filter(({ release }) => Boolean(release));

  useEffect(() => {
    if (!available.length) setLoading(true);
  }, []); // eslint-disable-line

  useEffect(() => {
    dispatch(fetchCollection()).then(() => setLoading(false));
  }, []); // eslint-disable-line

  useEffect(() => {
    if (userId) {
      dispatch(fetchUserEditions());
    }
  }, [dispatch, userId]);

  return (
    <Box as={"main"} flexGrow={1}>
      <Heading as="h3">
        Your Collection ({available.length} release{available.length === 1 ? "" : "s"})
      </Heading>
      {userEditions.length ? (
        <>
          <Heading as="h3">GridFire Editions</Heading>
          <Grid>
            {userEditions.map(({ _id: purchaseId, paid, release, transaction }) => {
              const hash = transaction.hash;
              const shortHash = hash.slice(0, 4) + "…" + hash.slice(-4);

              return (
                <Box key={purchaseId}>
                  <RenderRelease release={{ ...release, purchaseId }} type="collection" mb={2} />
                  <Flex justifyContent="flex-end">
                    <Text color={receiptTextColour}>
                      <Icon color={receiptColour} icon={faReceipt} mr={2} />
                      <Link href={`https://arbiscan.io/tx/${hash}`} variant="unstyled">
                        {shortHash}
                      </Link>
                      {paid ? (
                        <>
                          ,{" "}
                          <Box as="span" mr="0.2rem">
                            ◈
                          </Box>
                          {Number(formatEther(paid)).toFixed(2)}
                        </>
                      ) : null}
                      .
                    </Text>
                  </Flex>
                </Box>
              );
            })}
          </Grid>
        </>
      ) : null}
      {albums.length ? (
        <>
          <Heading as="h3">Albums</Heading>
          <Grid>
            {albums.map(({ _id: purchaseId, paid, purchaseDate, release, transaction }) => {
              const hash = transaction.hash;

              return (
                <Box key={purchaseId}>
                  <RenderRelease release={{ ...release, purchaseId }} type="collection" mb={2} />
                  <Flex justifyContent="flex-end">
                    <Text color={receiptTextColour}>
                      <Icon color={receiptColour} icon={faReceipt} mr={2} />
                      <Link href={`https://arbiscan.io/tx/${hash}`} variant="unstyled">
                        {DateTime.fromISO(purchaseDate).toFormat("ff")}
                      </Link>
                      ,{" "}
                      <Box as="span" mr="0.2rem">
                        ◈
                      </Box>
                      {Number(formatEther(paid)).toFixed(2)}.
                    </Text>
                  </Flex>
                </Box>
              );
            })}
          </Grid>
        </>
      ) : null}
      {singles.length ? (
        <>
          <Heading as="h3" mt={8}>
            Singles
          </Heading>
          <Grid>
            {singles.map(({ _id: purchaseId, paid, purchaseDate, release, trackId, transaction }) => {
              const hash = transaction.hash;
              const single = release.trackList.find(({ _id }) => _id === trackId);

              return (
                <Box key={purchaseId}>
                  <RenderRelease
                    release={{
                      ...release,
                      releaseTitle: `${single?.trackTitle ?? ""} (taken from \u2018${release.releaseTitle}\u2019)`,
                      purchaseId
                    }}
                    type="collection"
                    mb={2}
                  />
                  <Flex justifyContent="flex-end">
                    <Text color={receiptTextColour}>
                      <Icon color={receiptColour} icon={faReceipt} mr={2} />
                      <Link href={`https://arbiscan.io/tx/${hash}`} variant="unstyled">
                        {DateTime.fromISO(purchaseDate).toFormat("ff")}
                      </Link>
                      ,{" "}
                      <Box as="span" mr="0.2rem">
                        ◈
                      </Box>
                      {Number(formatEther(paid)).toFixed(2)}.
                    </Text>
                  </Flex>
                </Box>
              );
            })}
          </Grid>
        </>
      ) : null}
    </Box>
  );
};

export default Collection;
