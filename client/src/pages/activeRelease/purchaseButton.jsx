import { constants, utils } from "ethers";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import { toastError, toastWarning } from "state/toast";
import { Button } from "@chakra-ui/react";
import Icon from "components/icon";
import NameYourPriceModal from "./nameYourPriceModal";
import PropTypes from "prop-types";
import axios from "axios";
import { faCheckCircle } from "@fortawesome/free-solid-svg-icons";
import { faEthereum } from "@fortawesome/free-brands-svg-icons";
import { purchaseRelease } from "web3/contract";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const PurchaseButton = ({ inCollection, isLoading, price = 0, releaseId }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const { daiAllowance, isConnected, isFetchingAllowance } = useSelector(state => state.web3, shallowEqual);
  const { userId } = useSelector(state => state.user, shallowEqual);
  const allowanceTooLow = utils.parseEther(price.toString()).gt(daiAllowance) || daiAllowance.eq(constants.Zero);

  const handlePayment = async price => {
    try {
      setIsPurchasing(true);
      const res = await axios.get(`/api/release/${releaseId}/purchase`);
      const { paymentAddress, price: releasePrice } = res.data;

      if (Number(price) < Number(releasePrice)) {
        throw new Error(`Price must be at least ◈${releasePrice}.`);
      }

      await purchaseRelease({ paymentAddress, price, releaseId, userId });
    } catch (error) {
      if (error.code === "ACTION_REJECTED") {
        return void dispatch(toastWarning({ message: "Purchase cancelled.", title: "Cancelled" }));
      }

      if (error.code === -32603) {
        return void dispatch(
          toastError({
            message: "Please add more DAI or use a different account.",
            title: "DAI balance too low."
          })
        );
      }

      dispatch(toastError({ message: error.data?.message || error.message || error.toString(), title: "Error" }));
      console.error(error);
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <>
      <Button
        disabled={!isConnected || isFetchingAllowance}
        isLoading={isLoading || isPurchasing}
        loadingText={isLoading ? "Loading" : "Purchasing"}
        leftIcon={<Icon icon={inCollection ? faCheckCircle : faEthereum} />}
        minWidth="16rem"
        onClick={
          allowanceTooLow
            ? () => navigate("/dashboard/payment/approvals")
            : inCollection
            ? () => navigate("/dashboard/collection")
            : price === 0
            ? () => setShowModal(true)
            : handlePayment
        }
      >
        {inCollection
          ? "In collection"
          : !isConnected
          ? "Connect"
          : allowanceTooLow
          ? "Set allowance"
          : price === 0
          ? "Name your price"
          : "Buy"}
      </Button>
      <NameYourPriceModal
        handleCloseModal={() => setShowModal(false)}
        handleSubmit={handlePayment}
        initialPrice="10.00"
        isSubmitting={isPurchasing}
        showModal={showModal}
      />
    </>
  );
};

PurchaseButton.propTypes = {
  inCollection: PropTypes.bool,
  isLoading: PropTypes.bool,
  price: PropTypes.number,
  releaseId: PropTypes.string
};

export default PurchaseButton;
