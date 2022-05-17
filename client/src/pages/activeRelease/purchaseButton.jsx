import { Button, Center } from "@chakra-ui/react";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import { toastError, toastSuccess, toastWarning } from "state/toast";
import Icon from "components/icon";
import PropTypes from "prop-types";
import axios from "axios";
import { faCheckCircle } from "@fortawesome/free-solid-svg-icons";
import { faEthereum } from "@fortawesome/free-brands-svg-icons";
import { fetchUser } from "state/user";
import { purchaseRelease } from "web3/contract";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { utils } from "ethers";

const PurchaseButton = ({ inCollection, isLoading, price, releaseId }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isPurchasing, setIsPurchasing] = useState(false);
  const { daiAllowance, isConnected, isFetchingAllowance } = useSelector(state => state.web3, shallowEqual);
  const allowanceTooLow = utils.parseEther(`${price || 0}`).gt(daiAllowance);

  const handlePayment = async () => {
    try {
      setIsPurchasing(true);
      const res = await axios.get(`/api/release/purchase/${releaseId}`);
      const { paymentAddress, price } = res.data;
      const transactionHash = await purchaseRelease(paymentAddress, price);
      await axios.post(`/api/release/purchase/${releaseId}`, { transactionHash });
      dispatch(fetchUser());
      dispatch(toastSuccess({ message: "Purchased!", title: "Success" }));
    } catch (error) {
      if (error.code === 4001) {
        return void dispatch(toastWarning({ message: "Purchase cancelled.", title: "Cancelled" }));
      }

      if (error.code === -32603) {
        return void dispatch(
          toastError({
            message: "DAI balance too low. Please add more DAI or use a different account.",
            title: "Payment Error"
          })
        );
      }

      dispatch(toastError({ message: error.data?.message || error.message || error.toString(), title: "Error" }));
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <Center>
      <Button
        disabled={inCollection || !isConnected || isFetchingAllowance}
        isLoading={isLoading || isPurchasing}
        loadingText={isLoading ? "Loading" : "Purchasing"}
        leftIcon={<Icon icon={inCollection ? faCheckCircle : faEthereum} />}
        mb={8}
        onClick={allowanceTooLow ? () => navigate("/dashboard/address") : handlePayment}
      >
        {!price
          ? "Name your price"
          : inCollection
          ? "In collection"
          : !isConnected
          ? "Connect wallet"
          : allowanceTooLow
          ? "Approval required"
          : `Purchase ~ ${price} USD`}
      </Button>
    </Center>
  );
};

PurchaseButton.propTypes = {
  inCollection: PropTypes.bool,
  price: PropTypes.number,
  releaseId: PropTypes.string
};

export default PurchaseButton;
