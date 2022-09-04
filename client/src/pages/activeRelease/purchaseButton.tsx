import { constants, utils } from "ethers";
import { useDispatch, useSelector } from "hooks";
import { toastError, toastWarning } from "state/toast";
import { Button } from "@chakra-ui/react";
import Icon from "components/icon";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import NameYourPriceModal from "./nameYourPriceModal";
import axios from "axios";
import { faCheckCircle } from "@fortawesome/free-solid-svg-icons";
import { faEthereum } from "@fortawesome/free-brands-svg-icons";
import { purchaseRelease } from "web3/contract";
import { shallowEqual } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

interface Props {
  inCollection: boolean;
  isLoading: boolean;
  price: number;
  releaseId: string;
}

const PurchaseButton = ({ inCollection, isLoading, price = 0, releaseId }: Props) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const { daiAllowance, isConnected, isFetchingAllowance } = useSelector(state => state.web3, shallowEqual);
  const { userId } = useSelector(state => state.user, shallowEqual);
  const allowanceTooLow = utils.parseEther(price.toString()).gt(daiAllowance) || daiAllowance.eq(constants.Zero);

  const handlePayment = async (price: string) => {
    try {
      setIsPurchasing(true);
      const res = await axios.get(`/api/release/${releaseId}/purchase`);
      const { paymentAddress, price: releasePrice } = res.data;

      if (Number(price) < Number(releasePrice)) {
        throw new Error(`Price must be at least ◈${releasePrice}.`);
      }

      await purchaseRelease({ paymentAddress, price, releaseId, userId });
    } catch (error: any) {
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

  const handleClick = () => {
    if (allowanceTooLow) return void navigate("/dashboard/payment/approvals");
    if (inCollection) return void navigate("/dashboard/collection");
    if (price === 0) return void setShowModal(true);
    handlePayment(price.toFixed(2));
  };

  return (
    <>
      <Button
        disabled={!isConnected || isFetchingAllowance}
        isLoading={isLoading || isPurchasing}
        loadingText={isLoading ? "Loading" : "Purchasing"}
        leftIcon={<Icon icon={inCollection ? (faCheckCircle as IconProp) : (faEthereum as IconProp)} />}
        minWidth="16rem"
        onClick={handleClick}
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

export default PurchaseButton;
