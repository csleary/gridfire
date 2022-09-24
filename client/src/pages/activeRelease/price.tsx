import { Flex, Heading } from "@chakra-ui/react";

interface Props {
  price: string;
}

const Price = ({ price }: Props) => {
  if (Number(price) === 0) return null;

  const [dai, pennies] = Number(price).toFixed(2).split(".");

  return (
    <Flex justifyContent="center" mb={6}>
      <Flex alignItems="flex-start">
        <Heading as="span" alignSelf="center" color="gray.500" mb={0} mr="0.2rem" size="xl">
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