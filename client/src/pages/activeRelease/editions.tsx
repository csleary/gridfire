import { Accordion, Box, Divider, Flex, VStack, useColorModeValue, ScaleFade } from "@chakra-ui/react";
import { useCallback, useEffect, useState } from "react";
import { BigNumber } from "ethers";
import Edition from "./edition";
import { getGridFireEditionsByReleaseId } from "web3/contract";
import { useParams } from "react-router-dom";

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
      <ScaleFade in>
        <Accordion defaultIndex={[]} allowMultiple>
          <VStack spacing={6} mb={8}>
            {editions.map((edition, index) => {
              const { editionId } = edition;
              const formattedTokenId = BigNumber.from(editionId).toString();
              return <Edition edition={edition} fetchEditions={fetchEditions} index={index} key={formattedTokenId} />;
            })}
          </VStack>
        </Accordion>
      </ScaleFade>
    </>
  );
};

export default Editions;
