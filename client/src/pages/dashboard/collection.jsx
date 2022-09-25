import { Box, Heading, Link, Text, VStack, useColorModeValue } from "@chakra-ui/react";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import { fetchCollection, fetchUserEditions } from "state/releases";
import { useEffect, useState } from "react";
import Grid from "components/grid";
import Icon from "components/icon";
import RenderRelease from "components/renderRelease";
import { faReceipt } from "@fortawesome/free-solid-svg-icons";
import moment from "moment";
import { utils } from "ethers";

const Collection = () => {
  const dispatch = useDispatch();
  const { collection = {}, userEditions = [] } = useSelector(state => state.releases, shallowEqual);
  const { userId } = useSelector(state => state.user, shallowEqual);
  const { albums = [], singles = [] } = collection;
  const [isLoading, setLoading] = useState(false);
  const available = [...albums, ...singles, ...userEditions].filter(({ release }) => Boolean(release));
  const receiptTextColour = useColorModeValue("gray.600", "gray.300");
  const receiptColour = useColorModeValue("blue.200", "blue.100");

  useEffect(() => {
    if (!available.length) setLoading(true);
  }, []); // eslint-disable-line

  useEffect(() => {
    dispatch(fetchCollection()).then(() => setLoading(false));
  }, []); // eslint-disable-line

  useEffect(() => {
    if (userId) {
      dispatch(fetchUserEditions(userId));
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
            {userEditions.map(({ _id: purchaseId, paid, purchaseDate, release, transaction = {} }) => (
              <VStack key={purchaseId}>
                <RenderRelease release={{ ...release, purchaseDate, purchaseId }} type="collection" />
                <Box alignSelf="flex-end">
                  <Text color={receiptTextColour}>
                    <Icon color={receiptColour} icon={faReceipt} mr={2} />
                    <Link href={`https://arbiscan.io/tx/${transaction.transactionHash}`} variant="unstyled">
                      {transaction.transactionHash.slice(0, 4) + "…" + transaction.transactionHash.slice(-4)}
                    </Link>
                    {paid ? (
                      <>
                        ,{" "}
                        <Box as="span" mr="0.2rem">
                          ◈
                        </Box>
                        {Number(utils.formatEther(paid)).toFixed(2)}
                      </>
                    ) : null}
                    .
                  </Text>
                </Box>
              </VStack>
            ))}
          </Grid>
        </>
      ) : null}

      {albums.length ? (
        <>
          <Heading as="h3">Albums</Heading>
          <Grid>
            {albums.map(({ _id: purchaseId, paid, purchaseDate, release, transaction = {} }) => (
              <VStack key={purchaseId}>
                <RenderRelease release={{ ...release, purchaseDate, purchaseId }} type="collection" />
                <Box alignSelf="flex-end">
                  <Text color={receiptTextColour}>
                    <Icon color={receiptColour} icon={faReceipt} mr={2} />
                    <Link href={`https://arbiscan.io/tx/${transaction.transactionHash}`} variant="unstyled">
                      {moment(new Date(purchaseDate)).format("Do of MMM, YYYY")}
                    </Link>
                    ,{" "}
                    <Box as="span" mr="0.2rem">
                      ◈
                    </Box>
                    {Number(utils.formatEther(paid)).toFixed(2)}.
                  </Text>
                </Box>
              </VStack>
            ))}
          </Grid>
        </>
      ) : null}
      {singles.length ? (
        <>
          <Heading as="h3" mt={8}>
            Singles
          </Heading>
          <Grid>
            {singles.map(({ _id: purchaseId, paid, purchaseDate, release, trackId, transaction = {} }) => {
              const single = release.trackList.find(({ _id }) => _id === trackId);

              return (
                <VStack key={purchaseId}>
                  <RenderRelease
                    release={{
                      ...release,
                      releaseTitle: `${single.trackTitle} (taken from \u2018${release.releaseTitle}\u2019)`,
                      purchaseId
                    }}
                    type="collection"
                  />
                  <Box alignSelf="flex-end">
                    <Text color={receiptTextColour}>
                      <Icon color={receiptColour} icon={faReceipt} mr={2} />
                      <Link href={`https://arbiscan.io/tx/${transaction.transactionHash}`} variant="unstyled">
                        {moment(new Date(purchaseDate)).format("Do of MMM, YYYY")}
                      </Link>
                      ,{" "}
                      <Box as="span" mr="0.2rem">
                        ◈
                      </Box>
                      {Number(utils.formatEther(paid)).toFixed(2)}.
                    </Text>
                  </Box>
                </VStack>
              );
            })}
          </Grid>
        </>
      ) : null}
    </Box>
  );
};

export default Collection;
