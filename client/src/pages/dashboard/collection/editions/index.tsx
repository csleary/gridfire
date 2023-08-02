import { Box, Flex, Heading, Link, Text, useColorModeValue } from "@chakra-ui/react";
import { useDispatch, useSelector } from "hooks";
import { useEffect, useState } from "react";
import Grid from "components/grid";
import Icon from "components/icon";
import RenderRelease from "components/renderRelease";
import { faReceipt } from "@fortawesome/free-solid-svg-icons";
import { fetchUserEditions } from "state/releases";
import { formatEther } from "ethers";
import { shallowEqual } from "react-redux";

const Editions = () => {
  const receiptTextColour = useColorModeValue("gray.600", "gray.300");
  const receiptColour = useColorModeValue("blue.200", "blue.100");
  const dispatch = useDispatch();
  const userEditions = useSelector(state => state.releases.userEditions, shallowEqual);
  const userId = useSelector(state => state.user.userId);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      dispatch(fetchUserEditions()).finally(() => setLoading(false));
    }
  }, [dispatch, userId]);

  if (userEditions.length) {
    return (
      <>
        <Heading as="h3">GridFire Editions</Heading>
        <Grid>
          {userEditions.map(({ _id: purchaseId, metadata, paid, release, transaction }) => {
            const { description } = metadata || {};
            const hash = transaction.hash;
            const releaseTitle = description || release.releaseTitle;
            const shortHash = hash.slice(0, 4) + "…" + hash.slice(-4);

            return (
              <Box key={purchaseId}>
                <RenderRelease release={{ ...release, releaseTitle, purchaseId }} type="collection" mb={2} />
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
    );
  }
};

export default Editions;
