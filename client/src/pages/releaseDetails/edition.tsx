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
  Spinner,
  Text,
  useColorModeValue
} from "@chakra-ui/react";
import { formatEther } from "ethers";
import { toastError, toastWarning } from "state/toast";
import { useDispatch, useSelector } from "hooks";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { EditionPurchase, MintedEdition } from "types";
import Icon from "components/icon";
import axios from "axios";
import { fetchDaiBalance } from "state/web3";
import { purchaseEdition } from "web3/contract";
import { useState } from "react";
import { faEthereum } from "@fortawesome/free-brands-svg-icons";

const colors = [
  "var(--chakra-colors-green-200)",
  "var(--chakra-colors-blue-100)",
  "var(--chakra-colors-purple-100)",
  "var(--chakra-colors-gray-400)"
];

interface Props {
  edition: MintedEdition;
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
  const account = useSelector(state => state.web3.account);
  const daiAllowance = useSelector(state => state.web3.daiAllowance);
  const isConnected = useSelector(state => state.web3.isConnected);
  const isFetchingAllowance = useSelector(state => state.web3.isFetchingAllowance);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const allowanceTooLow = BigInt(price) > BigInt(daiAllowance) || BigInt(daiAllowance) === 0n;
  const bgColor = useColorModeValue("var(--chakra-colors-whiteAlpha-800)", "rgba(26,32,44,0.85)");
  const descriptionColor = useColorModeValue("var(--chakra-colors-chakra-body-text)", "gray.300");
  const infoColor = useColorModeValue("var(--chakra-colors-chakra-body-text)", "gray.300");
  const color1 = colors[index % colors.length];
  const color2 = colors[(index + 1) % colors.length];
  const formattedAmount = BigInt(amount).toString();
  const formattedBalance = BigInt(balance).toString();
  const formattedPrice = Number(formatEther(price)).toFixed(2);
  const isSoldOut = BigInt(balance) === 0n;
  const isDisabled = !isConnected || isFetchingAllowance || isPurchasing || isSoldOut;
  const transition = "200ms ease-in-out";

  const handlePurchase = async ({ editionId, price }: EditionPurchase) => {
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

  const handleClick = ({ allowanceTooLow, editionId, price }: EditionPurchase) => {
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

    handlePurchase({ editionId, price });
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
                {isPurchasing ? (
                  <Flex alignItems="center">
                    <Spinner mr={4} />
                    Purchasing…
                  </Flex>
                ) : isSoldOut ? (
                  "Sold Out"
                ) : (
                  `${formattedBalance}/${formattedAmount}`
                )}
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
                  onClick={() => handleClick({ allowanceTooLow, editionId, price })}
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
