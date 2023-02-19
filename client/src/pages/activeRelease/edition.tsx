import {
  AccordionButton,
  AccordionItem,
  AccordionPanel,
  Box,
  Button,
  Center,
  Flex,
  ListItem,
  OrderedList,
  Text,
  useColorModeValue
} from "@chakra-ui/react";
import { BigNumber, constants, utils } from "ethers";
import { toastError, toastWarning } from "state/toast";
import { useDispatch, useSelector } from "hooks";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { GridFireEdition } from "types";
import Icon from "components/icon";
import axios from "axios";
import { fetchDaiBalance } from "state/web3";
import { purchaseEdition } from "web3/contract";
import { shallowEqual } from "react-redux";
import { useState } from "react";
import { faEthereum } from "@fortawesome/free-brands-svg-icons";

const colors = [
  "var(--chakra-colors-green-200)",
  "var(--chakra-colors-blue-100)",
  "var(--chakra-colors-purple-100)",
  "var(--chakra-colors-gray-400)"
];

interface Props {
  edition: GridFireEdition;
  fetchEditions: () => void;
  index: number;
}

const Edition = ({ edition, fetchEditions, index }: Props) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const { releaseId = "" } = useParams();
  const { editionId, amount, balance, metadata, price } = edition;
  const { description, properties } = metadata;
  const { tracks } = properties;
  const { account, daiAllowance, isConnected, isFetchingAllowance } = useSelector(state => state.web3, shallowEqual);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const allowanceTooLow = BigNumber.from(price).gt(daiAllowance) || daiAllowance.eq(constants.Zero);
  const bgColor = useColorModeValue("var(--chakra-colors-whiteAlpha-800)", "rgba(26,32,44,0.85)");
  const descriptionColor = useColorModeValue("var(--chakra-colors-chakra-body-text)", "gray.300");
  const infoColor = useColorModeValue("var(--chakra-colors-chakra-body-text)", "gray.300");
  const color1 = colors[index % colors.length];
  const color2 = colors[(index + 1) % colors.length];
  const formattedAmount = BigNumber.from(amount).toString();
  const formattedBalance = BigNumber.from(balance).toString();
  const formattedPrice = utils.formatEther(price);
  const isSoldOut = BigNumber.from(balance).eq(constants.Zero);
  const isDisabled = !isConnected || isFetchingAllowance || isPurchasing || isSoldOut;
  const transition = "200ms ease-in-out";

  const handlePurchase = async ({ editionId, price }: GridFireEdition) => {
    try {
      setIsPurchasing(true);
      const res = await axios.get(`/api/release/${releaseId}/purchase`);
      const { paymentAddress: artist } = res.data;
      await purchaseEdition({ artist, editionId, price, releaseId });
      fetchEditions();
      dispatch(fetchDaiBalance(account));
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

  const handleClick = ({ allowanceTooLow, editionId, price }: GridFireEdition) => {
    if (allowanceTooLow) {
      dispatch(
        toastWarning({
          message: "Please increase your DAI spending allowance in order to make a purchase",
          title: "Allowance too low"
        })
      );

      const { pathname } = location;
      return void navigate("/dashboard/payment/approvals", { state: { pathname } });
    }

    handlePurchase({ editionId, metadata, price });
  };

  return (
    <AccordionItem border="none" width="100%">
      {({ isExpanded }) => (
        <Flex flexDirection="column">
          <Flex justifyContent="center">
            <AccordionButton
              color="var(--chakra-colors-blackAlpha-700)"
              display="flex"
              flex={`${isExpanded ? 1 : 0} 0 16rem`}
              fontSize="lg"
              fontWeight="bold"
              height="unset"
              justifyContent="space-between"
              px={4}
              py={3}
              position="relative"
              role="group"
              transition={transition}
              width="unset"
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
                transition={transition}
                transform={isExpanded ? "none" : "skewX(-10deg)"}
                _groupHover={isExpanded ? undefined : { transform: "skewX(-10deg) scale(1.03)" }}
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
            </AccordionButton>
          </Flex>
          <AccordionPanel
            background={`linear-gradient(to right, ${color1}, ${color2})`}
            mt={4}
            p={4}
            position="relative"
            rounded="lg"
            _before={{
              backgroundColor: bgColor,
              content: '""',
              inset: "0",
              position: "absolute"
            }}
          >
            <Box position="relative">
              <Center color={descriptionColor} fontSize="2xl" fontWeight="500" mb={4} mt={-2} width="100%">
                {description}
              </Center>
              <Text color={infoColor} mb={4}>
                Edition of {formattedAmount} ({formattedBalance} remaining).
              </Text>
              {tracks.length ? (
                <>
                  <Text color={infoColor}>Featuring these exclusive tracks:</Text>
                  <OrderedList fontWeight="500" mx={12} my={4} mb={12}>
                    {tracks.map(({ id, title }) => (
                      <ListItem key={id}>{title}</ListItem>
                    ))}
                  </OrderedList>
                </>
              ) : null}
              <Center>
                <Button
                  display="block"
                  isDisabled={isDisabled}
                  leftIcon={<Icon icon={faEthereum} />}
                  minWidth="16rem"
                  onClick={handleClick.bind(null, { allowanceTooLow, editionId, metadata, price })}
                >
                  Buy {description}
                </Button>
              </Center>
            </Box>
          </AccordionPanel>
        </Flex>
      )}
    </AccordionItem>
  );
};

export default Edition;
