import { Accordion, Box, Collapse, Divider, Flex, ScaleFade, useColorModeValue, VStack } from "@chakra-ui/react";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { fetchVisibleGridfireEditionsByReleaseId } from "@/web3";

import Edition from "./edition";

const Editions = () => {
  const textColor = useColorModeValue("gray.400", "gray.500");
  const color = useColorModeValue("gray.200", "gray.500");
  const { releaseId = "" } = useParams();
  const [editions, setEditions] = useState([]);
  const [isFetching, setIsFetching] = useState(true);

  const fetchEditions = useCallback(async () => {
    if (releaseId) {
      try {
        setIsFetching(true);
        const editions = await fetchVisibleGridfireEditionsByReleaseId(releaseId);
        setEditions(editions);
      } catch (error) {
        console.info(error);
      } finally {
        setIsFetching(false);
      }
    }
  }, [releaseId]);

  useEffect(() => {
    fetchEditions();
  }, [fetchEditions]);

  return (
    <>
      <Collapse
        animateOpacity
        in={editions.length > 0}
        transition={{ enter: { delay: 0.3, ease: [0.25, 0.8, 0.25, 1] } }}
        unmountOnExit
      >
        <Flex alignItems="center" mb={6}>
          <Box color={textColor} fontSize="sm" fontWeight="semibold" mr={2} textTransform="uppercase">
            Editions
          </Box>
          <Divider borderColor={color} />
        </Flex>
        <ScaleFade in>
          <Accordion allowMultiple>
            <VStack mb={8} spacing={6}>
              {editions.map((edition, index) => {
                const { editionId } = edition;
                const formattedTokenId = BigInt(editionId).toString();
                return <Edition edition={edition} fetchEditions={fetchEditions} index={index} key={formattedTokenId} />;
              })}
            </VStack>
          </Accordion>
        </ScaleFade>
      </Collapse>
    </>
  );
};

export default Editions;
