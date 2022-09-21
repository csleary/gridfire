import { BigNumber, constants, utils } from "ethers";
import { Box, Button, Divider, Flex, ScaleFade, VStack, useColorModeValue } from "@chakra-ui/react";
import { getGridFireEditionsByReleaseId, purchaseEdition } from "web3/contract";
import { toastError, toastWarning } from "state/toast";
import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "hooks";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { shallowEqual } from "react-redux";

const colors = [
  "var(--chakra-colors-green-200)",
  "var(--chakra-colors-blue-100)",
  "var(--chakra-colors-purple-100)",
  "var(--chakra-colors-gray-400)"
];

interface GridFireEdition {
  allowanceTooLow?: boolean;
  amount?: BigNumber;
  balance?: BigNumber;
  id: BigNumber;
  price: BigNumber;
}

const Editions = () => {
  const textColor = useColorModeValue("gray.400", "gray.500");
  const color = useColorModeValue("gray.200", "gray.500");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { releaseId = "" } = useParams();
  const { daiAllowance, isConnected, isFetchingAllowance } = useSelector(state => state.web3, shallowEqual);
  const { userId } = useSelector(state => state.user, shallowEqual);
  const [isPurchasing, setIsPurchasing] = useState(false);
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

  const handlePurchase = async ({ price, id }: GridFireEdition) => {
    try {
      setIsPurchasing(true);
      const res = await axios.get(`/api/release/${releaseId}/purchase`);
      const { paymentAddress } = res.data;
      await purchaseEdition({ paymentAddress, price, id, userId });
      fetchEditions();
    } catch (error: any) {
      if (error.code === "ACTION_REJECTED") {
        return void dispatch(toastWarning({ message: "Purchase cancelled.", title: "Cancelled" }));
      }

      dispatch(toastError({ message: error.data?.message || error.message || error.toString(), title: "Error" }));
      console.error(error);
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleClick = ({ allowanceTooLow, id, price }: GridFireEdition) => {
    if (allowanceTooLow) return void navigate("/dashboard/payment/approvals");
    handlePurchase({ id, price });
  };

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
        {editions.map(({ id, amount, balance, price }: GridFireEdition, index) => {
          const allowanceTooLow = BigNumber.from(price).gt(daiAllowance) || daiAllowance.eq(constants.Zero);
          const color1 = colors[index % colors.length];
          const color2 = colors[(index + 1) % colors.length];
          const formattedAmount = BigNumber.from(amount).toString();
          const formattedBalance = BigNumber.from(balance).toString();
          const formattedPrice = utils.formatEther(price);
          const formattedTokenId = BigNumber.from(id).toString();
          const isSoldOut = BigNumber.from(balance).eq(constants.Zero);

          return (
            <ScaleFade initialScale={0.9} in={true} key={formattedTokenId}>
              <Button
                color="var(--chakra-colors-blackAlpha-700)"
                disabled={!isConnected || isFetchingAllowance || isPurchasing || isSoldOut}
                display="flex"
                fontSize="lg"
                fontWeight="bold"
                height="unset"
                justifyContent="space-between"
                minWidth="16rem"
                onClick={handleClick.bind(null, { allowanceTooLow, price, id })}
                pt={3}
                pr={4}
                pb={3}
                pl={4}
                position="relative"
                role="group"
                transition="100ms ease-in"
                variant="unstyled"
                _hover={{ color: "blackAlpha.800" }}
              >
                <Box
                  background={`linear-gradient(to right, ${color1}, ${color2})`}
                  position="absolute"
                  top={0}
                  right={0}
                  bottom={0}
                  left={0}
                  rounded="lg"
                  transition="100ms ease-in"
                  transform="skewX(-10deg)"
                  _groupHover={{ color: "blackAlpha.800", transform: "skewX(-10deg) scale(1.03)" }}
                />
                <Box mr={4} zIndex={1}>
                  <Box as="span" mr="0.2rem">
                    ◈
                  </Box>
                  {formattedPrice}
                </Box>
                <Box mr={4} zIndex={1}>
                  {isPurchasing ? "Purchasing…" : isSoldOut ? "Sold Out" : `${formattedBalance}/${formattedAmount}`}
                </Box>
              </Button>
            </ScaleFade>
          );
        })}
      </VStack>
    </>
  );
};

export default Editions;
