import { Flex, Heading } from "@chakra-ui/react";

const Price = ({ price = "" }) => {
  if (price === 0) return null;

  const [dai, pennies] = price.toString().split(".");

  return (
    <Flex justifyContent="center" mb={6}>
      <Flex alignItems="flex-start">
        <Heading alignSelf="center" color="gray.500" as="span" mb={0} mr="0.2rem" size="xl">
          ◈
        </Heading>
        <Heading as="span" size="2xl" mr={1} mb={0}>
          {dai}
        </Heading>
        {pennies ? (
          <Heading as="span" borderBottomColor="gray.500" borderBottomWidth="1px" size="md" mr={2} mb={0} mt={1}>
            .{pennies}
          </Heading>
        ) : null}
      </Flex>
    </Flex>
  );
};

export default Price;
