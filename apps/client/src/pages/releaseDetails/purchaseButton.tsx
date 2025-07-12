import { Button } from "@chakra-ui/react";
import { faEthereum } from "@fortawesome/free-brands-svg-icons";
import { faCheckCircle } from "@fortawesome/free-solid-svg-icons";
import axios from "axios";
import { parseEther } from "ethers";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import Icon from "@/components/icon";
import { useDispatch, useSelector } from "@/hooks";
import { toastError, toastWarning } from "@/state/toast";
import { purchaseRelease } from "@/web3";

import NameYourPriceModal from "./nameYourPriceModal";

interface Props {
  inCollection: boolean;
  price: string;
  releaseId: string;
}

const PurchaseButton = ({ inCollection, price, releaseId }: Props) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const daiAllowance = useSelector(state => state.web3.daiAllowance);
  const isConnected = useSelector(state => state.web3.isConnected);
  const isFetchingAllowance = useSelector(state => state.web3.isFetchingAllowance);
  const isLoading = useSelector(state => state.releases.isLoading);
  const userId = useSelector(state => state.user.userId);
  const allowanceTooLow = price && (parseEther(price.toString()) > BigInt(daiAllowance) || BigInt(daiAllowance) === 0n);

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
    const { pathname } = location;
    if (inCollection) return void navigate("/dashboard/collection");
    if (allowanceTooLow) return void navigate("/dashboard/payment/approvals", { state: { pathname } });
    if (Number(price) === 0) return void setShowModal(true);
    handlePayment(Number(price).toFixed(2));
  };

  return (
    <>
      <Button
        isDisabled={isLoading || !isConnected || isFetchingAllowance}
        isLoading={isPurchasing}
        leftIcon={<Icon icon={inCollection ? faCheckCircle : faEthereum} />}
        loadingText={"Purchasing"}
        minWidth="16rem"
        onClick={handleClick}
      >
        {inCollection
          ? "In collection"
          : !isConnected
          ? "Connect"
          : allowanceTooLow
          ? "Set allowance"
          : Number(price) === 0
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
