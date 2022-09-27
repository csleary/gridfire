import { BigNumber, constants, utils } from "ethers";
import { Box, Button, chakra, shouldForwardProp } from "@chakra-ui/react";
import { motion, isValidMotionProp } from "framer-motion";
import { toastError, toastWarning } from "state/toast";
import { useDispatch, useSelector } from "hooks";
import { useNavigate, useParams } from "react-router-dom";
import { GridFireEdition } from "types";
import axios from "axios";
import { fetchDaiBalance } from "state/web3";
import { purchaseEdition } from "web3/contract";
import { shallowEqual } from "react-redux";
import { useState } from "react";

const ScaleFadeCustom = chakra(motion.div, {
  shouldForwardProp: prop => isValidMotionProp(prop) || shouldForwardProp(prop)
});

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
  const navigate = useNavigate();
  const { releaseId = "" } = useParams();
  const { editionId, amount, balance, price } = edition;
  const { account, daiAllowance, isConnected, isFetchingAllowance } = useSelector(state => state.web3, shallowEqual);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const allowanceTooLow = BigNumber.from(price).gt(daiAllowance) || daiAllowance.eq(constants.Zero);
  const color1 = colors[index % colors.length];
  const color2 = colors[(index + 1) % colors.length];
  const formattedAmount = BigNumber.from(amount).toString();
  const formattedBalance = BigNumber.from(balance).toString();
  const formattedPrice = utils.formatEther(price);
  const isSoldOut = BigNumber.from(balance).eq(constants.Zero);
  const isDisabled = !isConnected || isFetchingAllowance || isPurchasing || isSoldOut;

  const handlePurchase = async ({ editionId, price }: GridFireEdition) => {
    try {
      setIsPurchasing(true);
      const res = await axios.get(`/api/release/${releaseId}/purchase`);
      const { paymentAddress: artist } = res.data;
      await purchaseEdition({ artist, editionId, price });
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
    if (allowanceTooLow) return void navigate("/dashboard/payment/approvals");
    handlePurchase({ editionId, price });
  };

  return (
    <ScaleFadeCustom
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: "1", ease: "easeOut" }}
    >
      <Button
        color="var(--chakra-colors-blackAlpha-700)"
        disabled={isDisabled}
        display="flex"
        fontSize="lg"
        fontWeight="bold"
        height="unset"
        justifyContent="space-between"
        minWidth="16rem"
        onClick={handleClick.bind(null, { allowanceTooLow, editionId, price })}
        pt={3}
        pr={4}
        pb={3}
        pl={4}
        position="relative"
        role="group"
        transition="100ms ease-in"
        variant="unstyled"
        _hover={isDisabled ? undefined : { color: "blackAlpha.800" }}
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
          _groupHover={isDisabled ? undefined : { transform: "skewX(-10deg) scale(1.03)" }}
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
    </ScaleFadeCustom>
  );
};

export default Edition;
