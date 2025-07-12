import { Box, Flex, Heading, Link, Text, useColorModeValue } from "@chakra-ui/react";
import { faReceipt } from "@fortawesome/free-solid-svg-icons";
import { formatEther } from "ethers";
import { DateTime } from "luxon";
import { useEffect, useState } from "react";
import { shallowEqual } from "react-redux";

import Grid from "@/components/grid";
import Icon from "@/components/icon";
import RenderRelease from "@/components/renderRelease";
import { useDispatch, useSelector } from "@/hooks";
import { fetchUserAlbums } from "@/state/releases";

const Albums = () => {
  const receiptTextColour = useColorModeValue("gray.600", "gray.300");
  const receiptColour = useColorModeValue("blue.200", "blue.100");
  const dispatch = useDispatch();
  const albums = useSelector(state => state.releases.userAlbums, shallowEqual);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    dispatch(fetchUserAlbums()).finally(() => setLoading(false));
  }, [dispatch]);

  if (albums.length) {
    return (
      <>
        <Heading as="h3">Albums</Heading>
        <Grid>
          {albums.map(({ _id: purchaseId, paid, purchaseDate, release, transactionHash }) => {
            return (
              <Box key={purchaseId}>
                <RenderRelease mb={2} release={{ ...release, purchaseId }} type="collection" />
                <Flex justifyContent="flex-end">
                  <Text color={receiptTextColour}>
                    <Icon color={receiptColour} icon={faReceipt} mr={2} />
                    <Link href={`https://arbiscan.io/tx/${transactionHash}`} variant="unstyled">
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
    );
  }

  return null;
};

export default Albums;
