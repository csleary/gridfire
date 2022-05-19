import {
  Avatar,
  Box,
  Button,
  Flex,
  IconButton,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  ModalHeader,
  Spacer,
  VStack,
  useColorModeValue
} from "@chakra-ui/react";
import { checkoutBasket, emptyBasket, removeFromBasket } from "state/web3";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import Icon from "components/icon";
import { faEthereum } from "@fortawesome/free-brands-svg-icons";
import { faMinusSquare, faShoppingBasket } from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import { BigNumber, utils } from "ethers";

const BasketButton = () => {
  const dispatch = useDispatch();
  const { basket, isCheckingOut, isConnected } = useSelector(state => state.web3, shallowEqual);
  const [showModal, setShowModal] = useState(false);
  const total = basket.reduce((prev, curr) => prev.add(curr.price), BigNumber.from("0"));

  const handleCheckout = async () => {
    try {
      await dispatch(checkoutBasket(basket));
      dispatch(emptyBasket());
      setShowModal(false);
    } catch (error) {
      console.log(error);
    }
  };

  const handleCloseModal = async () => {
    setShowModal(false);
  };

  return (
    <>
      <Button leftIcon={<Icon icon={faShoppingBasket} />} onClick={() => setShowModal(true)}>
        Basket ({basket.length})
      </Button>
      <Modal isOpen={showModal} onClose={handleCloseModal} size="lg" isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalHeader>Your Basket</ModalHeader>
          <ModalBody>
            <VStack spacing={3} alignItems="unset">
              {basket.map(({ artistName, imageUrl, price, id, title }) => (
                <Flex key={id} alignItems="center">
                  <Avatar name={title} src={imageUrl} mr={4} />
                  <Box>
                    {artistName} - {title}
                  </Box>
                  <Spacer />
                  <Box mr={4}>◈ {Number(utils.formatEther(price)).toFixed(2)}</Box>
                  <IconButton icon={<Icon icon={faMinusSquare} />} onClick={() => dispatch(removeFromBasket(id))} />
                </Flex>
              ))}
              <Flex justifyContent="flex-end">
                <Box mr={4}>Total: ◈ {Number(utils.formatEther(total)).toFixed(2)}</Box>
              </Flex>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button onClick={handleCloseModal}>Close</Button>
            <Button
              colorScheme={useColorModeValue("yellow", "purple")}
              leftIcon={<Icon icon={faEthereum} />}
              isDisabled={!basket.length || !isConnected || isCheckingOut}
              isLoading={isCheckingOut}
              loadingText="Checking out…"
              onClick={handleCheckout}
              ml="auto"
            >
              Checkout
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default BasketButton;
