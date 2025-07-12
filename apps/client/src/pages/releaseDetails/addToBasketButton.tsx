import { Button } from "@chakra-ui/react";
import { faShoppingBasket } from "@fortawesome/free-solid-svg-icons";
import { BasketItem } from "@gridfire/shared/types";
import axios from "axios";
import { parseEther } from "ethers";
import { useState } from "react";
import { shallowEqual } from "react-redux";

import Icon from "@/components/icon";
import { useDispatch, useSelector } from "@/hooks";
import { toastError } from "@/state/toast";
import { addToBasket, setIsAddingToBasket } from "@/state/web3";

import NameYourPriceModal from "./nameYourPriceModal";

interface Props {
  artistName: string;
  imageUrl: string;
  inCollection: boolean;
  price: string;
  releaseId: string;
  title: string;
}

const AddToBasketButton = ({ artistName, imageUrl, inCollection, price, releaseId, title }: Props) => {
  const dispatch = useDispatch();
  const basket = useSelector(state => state.web3.basket, shallowEqual);
  const isAddingToBasket = useSelector(state => state.web3.isAddingToBasket);
  const isLoading = useSelector(state => state.releases.isLoading);
  const [showModal, setShowModal] = useState(false);
  const isInBasket = basket.some((item: BasketItem) => item.releaseId === releaseId);

  const handleAddToBasket = async (price: string) => {
    try {
      dispatch(setIsAddingToBasket(true));
      const res = await axios.get(`/api/release/${releaseId}/purchase`);
      const { paymentAddress, price: releasePrice } = res.data;

      if (Number(price) < Number(releasePrice)) {
        throw new Error(`Price must be at least ◈${releasePrice}.`);
      }

      const priceInWei = parseEther(price);
      dispatch(addToBasket({ artistName, imageUrl, paymentAddress, price: priceInWei.toString(), releaseId, title }));
    } catch (error: any) {
      dispatch(toastError({ message: error.message, title: "Error" }));
      console.error(error);
    } finally {
      dispatch(setIsAddingToBasket(false));
    }
  };

  const handleClick = () => {
    if (Number(price) === 0) {
      return void setShowModal(true);
    }

    handleAddToBasket(Number(price).toFixed(2));
  };

  return (
    <>
      <Button
        isDisabled={isLoading || inCollection || isAddingToBasket || isInBasket}
        isLoading={isAddingToBasket}
        leftIcon={<Icon icon={faShoppingBasket} />}
        minW="8rem"
        onClick={handleClick}
      >
        {isInBasket ? "Added" : "Add"}
      </Button>
      <NameYourPriceModal
        handleCloseModal={() => setShowModal(false)}
        handleSubmit={handleAddToBasket}
        info="Enter the amount you wish to pay for this release, before adding it to your basket."
        initialPrice="10.00"
        isSubmitting={isAddingToBasket}
        showModal={showModal}
        submitButton="Add to Basket"
        submitButtonLoading="Adding…"
        submitInfo=""
      />
    </>
  );
};

export default AddToBasketButton;
