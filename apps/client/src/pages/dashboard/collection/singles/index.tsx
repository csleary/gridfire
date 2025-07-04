import Grid from "@/components/grid";
import Icon from "@/components/icon";
import RenderRelease from "@/components/renderRelease";
import { useDispatch, useSelector } from "@/hooks";
import { fetchUserSingles } from "@/state/releases";
import { Box, Flex, Heading, Link, Text, useColorModeValue } from "@chakra-ui/react";
import { faReceipt } from "@fortawesome/free-solid-svg-icons";
import { formatEther } from "ethers";
import { DateTime } from "luxon";
import { useEffect, useState } from "react";
import { shallowEqual } from "react-redux";

const Singles = () => {
  const receiptTextColour = useColorModeValue("gray.600", "gray.300");
  const receiptColour = useColorModeValue("blue.200", "blue.100");
  const dispatch = useDispatch();
  const singles = useSelector(state => state.releases.userSingles, shallowEqual);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    dispatch(fetchUserSingles()).finally(() => setLoading(false));
  }, [dispatch]);

  if (singles.length) {
    return (
      <>
        <Heading as="h3" mt={8}>
          Singles
        </Heading>
        <Grid>
          {singles.map(({ _id: purchaseId, paid, purchaseDate, release, trackId, transactionHash }) => {
            const single = release.trackList.find(({ _id }) => _id === trackId);

            return (
              <Box key={purchaseId}>
                <RenderRelease
                  release={{
                    ...release,
                    releaseTitle: `${single?.trackTitle ?? ""} (taken from '${release.releaseTitle}')`,
                    purchaseId
                  }}
                  type="collection"
                  mb={2}
                />
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

export default Singles;
