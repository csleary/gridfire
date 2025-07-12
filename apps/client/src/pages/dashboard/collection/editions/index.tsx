import { Box, Flex, Heading, Link, Text, useColorModeValue } from "@chakra-ui/react";
import { faReceipt } from "@fortawesome/free-solid-svg-icons";
import { formatEther } from "ethers";
import { useEffect, useState } from "react";
import { shallowEqual } from "react-redux";

import Grid from "@/components/grid";
import Icon from "@/components/icon";
import RenderRelease from "@/components/renderRelease";
import { useDispatch, useSelector } from "@/hooks";
import { fetchUserEditions } from "@/state/releases";

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
        <Heading as="h3">Gridfire Editions</Heading>
        <Grid>
          {userEditions.map(({ _id: purchaseId, metadata, paid, release, transactionHash }) => {
            const { description } = metadata || {};
            const releaseTitle = description || release.releaseTitle;
            const shortHash = transactionHash.slice(0, 4) + "…" + transactionHash.slice(-4);

            return (
              <Box key={purchaseId}>
                <RenderRelease mb={2} release={{ ...release, purchaseId, releaseTitle }} type="collection" />
                <Flex justifyContent="flex-end">
                  <Text color={receiptTextColour}>
                    <Icon color={receiptColour} icon={faReceipt} mr={2} />
                    <Link href={`https://arbiscan.io/tx/${transactionHash}`} variant="unstyled">
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
