import { Box, Divider, Flex, VStack, useColorModeValue } from "@chakra-ui/react";
import { useCallback, useEffect, useState } from "react";
import { BigNumber } from "ethers";
import Edition from "./edition";
import { getGridFireEditionsByReleaseId } from "web3/contract";
import { useParams } from "react-router-dom";

export interface GridFireEdition {
  allowanceTooLow?: boolean;
  amount?: BigNumber;
  balance?: BigNumber;
  editionId: BigNumber;
  price: BigNumber;
}

const Editions = () => {
  const textColor = useColorModeValue("gray.400", "gray.500");
  const color = useColorModeValue("gray.200", "gray.500");
  const { releaseId = "" } = useParams();
  const [editions, setEditions] = useState([]);

  const fetchEditions = useCallback(async () => {
    if (releaseId) {
      const editions = await getGridFireEditionsByReleaseId(releaseId);
      setEditions(editions);
    }
  }, [releaseId]);

  useEffect(() => {
    fetchEditions();
  }, [fetchEditions]);

  if (!editions.length) return null;

  return (
    <>
      <Flex alignItems="center" mb={6}>
        <Box color={textColor} fontWeight="semibold" fontSize="sm" textTransform="uppercase" mr={2}>
          Editions
        </Box>
        <Divider borderColor={color} />
      </Flex>
      <VStack spacing={6} mb={8}>
        {editions.map((edition, index) => (
          <Edition edition={edition} fetchEditions={fetchEditions} index={index} />
        ))}
      </VStack>
    </>
  );
};

export default Editions;
