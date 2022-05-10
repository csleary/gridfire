import { Button, Center } from "@chakra-ui/react";
import { ethers, utils } from "ethers";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import { toastError, toastSuccess, toastWarning } from "state/toast";
import Icon from "components/icon";
import PropTypes from "prop-types";
import axios from "axios";
import detectEthereumProvider from "@metamask/detect-provider";
import { faCheckCircle } from "@fortawesome/free-solid-svg-icons";
import { faEthereum } from "@fortawesome/free-brands-svg-icons";
import { fetchUser } from "state/user";
import { getGridFireContract } from "web3/contract";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const PurchaseButton = ({ inCollection, isLoading, price, releaseId }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isPurchasing, setIsPurchasing] = useState(false);
  const { daiAllowance, isConnected } = useSelector(state => state.web3, shallowEqual);
  const allowanceTooLow = utils.parseEther(`${price || 0}`).gt(daiAllowance);

  const handlePayment = async () => {
    try {
      const ethereum = await detectEthereumProvider();
      const provider = new ethers.providers.Web3Provider(ethereum, "any");
      const signer = provider.getSigner();
      const gridFirePayment = getGridFireContract(signer);

      setIsPurchasing(true);
      const res = await axios.get(`/api/release/purchase/${releaseId}`);
      const { release, paymentAddress } = res.data;
      const weiReleasePrice = utils.parseEther(`${release.price}`);
      const transactionReceipt = await gridFirePayment.purchase(paymentAddress, weiReleasePrice, weiReleasePrice);
      const confirmedTransaction = await transactionReceipt.wait(0);
      const { status, transactionHash } = confirmedTransaction;
      if (status !== 1) throw new Error("Transaction unsuccessful.");
      await axios.post(`/api/release/purchase/${releaseId}`, { transactionHash });
      dispatch(fetchUser());
      dispatch(toastSuccess({ message: "Purchased!", title: "Success" }));
    } catch (error) {
      if (error.code === 4001) {
        return void dispatch(toastWarning({ message: "Purchase cancelled.", title: "Cancelled" }));
      }

      dispatch(
        toastError({ message: error.response?.data?.error || error.message || error.toString(), title: "Error" })
      );
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <Center>
      <Button
        disabled={inCollection || !isConnected}
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
