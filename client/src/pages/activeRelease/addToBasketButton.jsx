import { Button } from "@chakra-ui/react";
import { addToBasket, setIsAddingToBasket } from "state/web3";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import Icon from "components/icon";
import PropTypes from "prop-types";
import axios from "axios";
import { faShoppingBasket } from "@fortawesome/free-solid-svg-icons";
import { utils } from "ethers";

const AddToBasketButton = ({ artistName, imageUrl, inCollection, releaseId, title }) => {
  const dispatch = useDispatch();
  const { basket, isAddingToBasket } = useSelector(state => state.web3, shallowEqual);
  const isInBasket = basket.some(item => item.releaseId === releaseId);

  const handleAddToBasket = async () => {
    try {
      dispatch(setIsAddingToBasket(true));
      const res = await axios.get(`/api/release/${releaseId}/purchase`);
      const { paymentAddress, price } = res.data;
      const priceInWei = utils.parseEther(price.toString());
      dispatch(addToBasket({ artistName, releaseId, imageUrl, paymentAddress, price: priceInWei, title }));
    } catch (error) {
      console.error(error);
    } finally {
      dispatch(setIsAddingToBasket(false));
    }
  };

  return (
    <Button
      disabled={inCollection || isAddingToBasket || isInBasket}
      leftIcon={<Icon icon={faShoppingBasket} />}
      isLoading={isAddingToBasket}
      minW="8rem"
      onClick={handleAddToBasket}
    >
      {isInBasket ? "Added" : "Add"}
    </Button>
  );
};

AddToBasketButton.propTypes = {
  artistName: PropTypes.string,
  releaseId: PropTypes.string,
  price: PropTypes.object, // BigNumber
  title: PropTypes.string
};

export default AddToBasketButton;
