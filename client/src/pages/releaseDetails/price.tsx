import { Flex, Heading, Skeleton } from "@chakra-ui/react";
import { useSelector } from "hooks";

interface Props {
  price: string;
}

const Price = ({ price }: Props) => {
  const isLoading = useSelector(state => state.releases.isLoading);
  if (Number(price) === 0) return null;
  const [dai, cents] = Number(price).toFixed(2).split(".");

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
          {cents ? (
            <Heading as="span" borderBottomColor="gray.500" borderBottomWidth="1px" size="md" mb={0} mt={1}>
              .{cents}
            </Heading>
          ) : null}
        </Flex>
      </Flex>
    </Skeleton>
  );
};

export default Price;
