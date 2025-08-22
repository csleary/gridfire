import {
  AccordionButton,
  AccordionItem,
  AccordionPanel,
  Box,
  Button,
  Center,
  Divider,
  Flex,
  Heading,
  ListItem,
  OrderedList,
  Spinner,
  Text,
  useColorModeValue
} from "@chakra-ui/react";
import { faEthereum } from "@fortawesome/free-brands-svg-icons";
import { EditionPurchase, MintedEdition } from "@gridfire/shared/types";
import { nanoid } from "@reduxjs/toolkit";
import axios from "axios";
import { isAxiosError } from "axios";
import { formatEther } from "ethers";
import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import Icon from "@/components/icon";
import { useDispatch, useSelector } from "@/hooks";
import { addActiveProcess, removeActiveProcess } from "@/state/user";
import { fetchDaiBalance } from "@/state/web3";
import { toastError, toastWarning } from "@/utils/toast";
import { purchaseEdition } from "@/web3";

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
  const { amount, balance, editionId, metadata, price } = edition;
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
  const transition = "150ms ease-in-out";

  const handlePurchase = async ({ editionId, price }: EditionPurchase) => {
    const processId = nanoid();

    try {
      dispatch(addActiveProcess({ description: "Purchasing edition…", id: processId, type: "purchase" }));
      setIsPurchasing(true);
      const res = await axios.get(`/api/release/${releaseId}/purchase`);
      const { paymentAddress: artist } = res.data;
      await purchaseEdition({ artist, editionId, price, releaseId });
      fetchEditions();
      dispatch(fetchDaiBalance(account));
    } catch (error: unknown) {
      console.log(error);

      if (error && typeof error === "object" && "code" in error && error.code === "ACTION_REJECTED") {
        return void dispatch(toastWarning({ message: "Purchase cancelled.", title: "Cancelled" }));
      }

      if (isAxiosError(error)) {
        return void dispatch(toastError({ message: error.response?.data?.message, title: "Request error" }));
      }

      if (error instanceof Error) {
        dispatch(toastError({ message: error.message, title: "Error" }));
      }

      console.error(error);
    } finally {
      dispatch(removeActiveProcess(processId));
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
    <AccordionItem alignSelf="stretch" border="none">
      {({ isExpanded }) => (
        <>
          <Heading display="flex" justifyContent="center" m={0}>
            <AccordionButton
              _expanded={{ flex: "1 0 16rem" }}
              _hover={{ color: "blackAlpha.800" }}
              color="var(--chakra-colors-blackAlpha-700)"
              display="flex"
              flex="0 0 16rem"
              fontSize="lg"
              fontWeight="bold"
              justifyContent="space-between"
              position="relative"
              px={4}
              py={3}
              role="group"
              transition={transition}
              width="unset"
            >
              <Box
                _groupHover={isExpanded ? undefined : { transform: "skewX(-10deg) scale(1.05)" }}
                background={`linear-gradient(to right, ${color1}, ${color2})`}
                inset={0}
                position="absolute"
                rounded="lg"
                transform={isExpanded ? "none" : "skewX(-10deg)"}
                transition={transition}
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
          </Heading>
          <AccordionPanel
            _before={{
              backgroundColor: bgColor,
              content: '""',
              inset: "0",
              position: "absolute"
            }}
            background={`linear-gradient(to right, ${color1}, ${color2})`}
            mt={4}
            p={6}
            position="relative"
            rounded="lg"
          >
            <Box position="relative">
              <Center color={descriptionColor} fontSize="2xl" fontWeight="500" mb={4} mt={-2}>
                {description}
              </Center>
              <Divider borderColor="whiteAlpha.300" my={4} />
              <Text color={infoColor} mb={4}>
                Edition of {formattedAmount} ({formattedBalance} remaining).
              </Text>
              {tracks.length ? (
                <>
                  <Text color={infoColor}>Featuring these exclusive tracks:</Text>
                  <OrderedList fontWeight="500" mb={12} mx={12} my={4}>
                    {tracks.map(({ id, title }) => (
                      <ListItem key={id}>{title}</ListItem>
                    ))}
                  </OrderedList>
                </>
              ) : null}
              <Divider borderColor="whiteAlpha.300" my={6} />
              <Center>
                <Button
                  display="block"
                  isDisabled={isDisabled}
                  leftIcon={<Icon icon={faEthereum} />}
                  minWidth="16rem"
                  onClick={() => handleClick({ allowanceTooLow, editionId, price })}
                >
                  {!isConnected ? "Connect wallet" : "Buy edition"}
                </Button>
              </Center>
            </Box>
          </AccordionPanel>
        </>
      )}
    </AccordionItem>
  );
};

export default Edition;
