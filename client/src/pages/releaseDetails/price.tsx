import { Flex, Heading, Skeleton } from "@chakra-ui/react";
import { shallowEqual } from "react-redux";
import { useSelector } from "hooks";

interface Props {
  price: string;
}

const Price = ({ price }: Props) => {
  const { isLoading } = useSelector(state => state.releases, shallowEqual);

  if (Number(price) === 0) return null;

  const [dai, pennies] = Number(price).toFixed(2).split(".");

  return (
    <Skeleton isLoaded={!isLoading} mb={6}>
      <Flex justifyContent="center">
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
    </Skeleton>
  );
};

export default Price;