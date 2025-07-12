import { Heading, Text, VStack } from "@chakra-ui/react";

import { useSelector } from "@/hooks";

const Artist = () => {
  const biography = useSelector(state => state.releases.artist.biography) ?? "";

  return (
    <>
      <Heading as="h3">Biography</Heading>
      <VStack mb={12} spacing={6}>
        {biography
          .split("\n")
          .filter(text => text.trim().length)
          .map((paragraph, index) => (
            <Text key={index}>{paragraph}</Text>
          ))}
      </VStack>
    </>
  );
};

export default Artist;
