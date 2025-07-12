import { Flex, Heading, Skeleton } from "@chakra-ui/react";

import { useSelector } from "@/hooks";

interface Props {
  price: string;
}

const Price = ({ price }: Props) => {
  const isLoading = useSelector(state => state.releases.isLoading);
  if (!price || Number.isNaN(price)) return null;
  if (Number(price) === 0) return null;
  const [dai, cents] = Number(price).toFixed(2).split(".");

  return (
    <Skeleton isLoaded={!isLoading} mb={6}>
      <Flex justifyContent="center">
        <Flex alignItems="flex-start">
          <Heading alignSelf="center" as="span" color="gray.500" mb={0} mr="0.2rem" size="xl">
            ◈
          </Heading>
          <Heading as="span" mb={0} mr={1} size="2xl">
            {dai}
          </Heading>
          {cents ? (
            <Heading as="span" borderBottomColor="gray.500" borderBottomWidth="1px" mb={0} mt={1} size="md">
              .{cents}
            </Heading>
          ) : null}
        </Flex>
      </Flex>
    </Skeleton>
  );
};

export default Price;
