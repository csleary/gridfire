import { Accordion, Box, Collapse, Divider, Flex, ScaleFade, VStack, useColorModeValue } from "@chakra-ui/react";
import { useCallback, useEffect, useState } from "react";
import Edition from "./edition";
import { fetchVisibleGridfireEditionsByReleaseId } from "web3";
import { useParams } from "react-router-dom";

const Editions = () => {
  const textColor = useColorModeValue("gray.400", "gray.500");
  const color = useColorModeValue("gray.200", "gray.500");
  const { releaseId = "" } = useParams();
  const [editions, setEditions] = useState([]);

  const fetchEditions = useCallback(async () => {
    if (releaseId) {
      const editions = await fetchVisibleGridfireEditionsByReleaseId(releaseId);
      setEditions(editions);
    }
  }, [releaseId]);

  useEffect(() => {
    fetchEditions();
  }, [fetchEditions]);

  return (
    <>
      <Collapse
        transition={{ enter: { delay: 0.3, ease: [0.25, 0.1, 0.25, 1] } }}
        in={editions.length > 0}
        animateOpacity
        unmountOnExit
      >
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
