import { toastError, toastSuccess } from "features/toast";
import { Button, Center } from "@chakra-ui/react";
import { ethers, Contract } from "ethers";
import GridFirePayment from "contracts/GridFirePayment.json";
import Icon from "components/icon";
import PropTypes from "prop-types";
import axios from "axios";
import { faCheckCircle } from "@fortawesome/free-solid-svg-icons";
import { faEthereum } from "@fortawesome/free-brands-svg-icons";
import { fetchUser } from "features/user";
import { useDispatch } from "react-redux";
import { useState } from "react";

const { REACT_APP_CONTRACT_ADDRESS } = process.env;

const PurchaseButton = ({ inCollection, isLoading, price, releaseId }) => {
  const dispatch = useDispatch();
  const [isPurchasing, setIsPurchasing] = useState(false);

  const handlePayment = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum, "any");
    const signer = provider.getSigner();
    const contract = new Contract(REACT_APP_CONTRACT_ADDRESS, GridFirePayment.abi, signer);

    try {
      setIsPurchasing(true);
      const res = await axios.get(`/api/release/purchase/${releaseId}`);
      const { release, paymentAddress } = res.data;

      const transactionReceipt = await contract.purchase(paymentAddress, release.price, {
        value: price
      });

      const confirmedTransaction = await transactionReceipt.wait(0);
      const { transactionHash } = confirmedTransaction;
      await axios.post(`/api/release/purchase/${releaseId}`, { transactionHash });
      dispatch(fetchUser());
      dispatch(toastSuccess("Purchased!"));
    } catch (error) {
      dispatch(toastError(error.response?.data?.error || error.message || error.toString()));
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <Center>
      <Button
        disabled={inCollection}
        isLoading={isLoading || isPurchasing}
        loadingText={isLoading ? "Loading" : "Purchasing"}
        leftIcon={<Icon icon={inCollection ? faCheckCircle : faEthereum} />}
        mb={8}
        onClick={handlePayment}
      >
        {!price ? "Name Your Price" : inCollection ? "In Collection" : `Purchase ~ ${price} USD`}
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
