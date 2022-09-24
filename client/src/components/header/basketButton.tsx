import {
  Avatar,
  AvatarGroup,
  Box,
  Button,
  Divider,
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
  Text,
  VStack,
  useColorModeValue
} from "@chakra-ui/react";
import { BigNumber, utils } from "ethers";
import { checkoutBasket, connectToWeb3, emptyBasket, removeFromBasket } from "state/web3";
import { useDispatch, useSelector } from "hooks";
import Icon from "components/icon";
import { Link as RouterLink } from "react-router-dom";
import { faEthereum } from "@fortawesome/free-brands-svg-icons";
import { faShoppingBasket, faTimes } from "@fortawesome/free-solid-svg-icons";
import { fetchDaiBalance } from "state/web3";
import { shallowEqual } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export interface BasketItem {
  artistName: string;
  imageUrl: string;
  paymentAddress: string;
  price: BigNumber;
  title: string;
  releaseId: string;
}

const BasketButton = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    account,
    basket,
    daiAllowance = 0,
    isCheckingOut,
    isConnected,
    isFetchingAllowance
  } = useSelector(state => state.web3, shallowEqual);

  const [showModal, setShowModal] = useState(false);
  const total = basket.reduce((prev, curr: BasketItem) => prev.add(curr.price), BigNumber.from("0"));
  const allowanceTooLow = total.gt(daiAllowance);

  const handleCheckout = async () => {
    try {
      await dispatch(checkoutBasket(basket));
      dispatch(fetchDaiBalance(account));
      dispatch(emptyBasket());
      setShowModal(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleConnect = async () => {
    await dispatch(connectToWeb3());
  };

  const handleNavigateToPayment = () => {
    setShowModal(false);
    navigate("/dashboard/payment/approvals");
  };

  return (
    <>
      <Button leftIcon={<Icon icon={faShoppingBasket} />} onClick={() => setShowModal(true)}>
        Basket
        {basket.length ? (
          <AvatarGroup size="xs" max={5} ml={2}>
            {basket.map(({ imageUrl, releaseId, title }) => (
              <Avatar key={releaseId} loading="lazy" name={title} src={imageUrl} />
            ))}
          </AvatarGroup>
        ) : null}
      </Button>
      <Modal isOpen={showModal} onClose={handleCloseModal} size="lg" isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalHeader>Your Basket</ModalHeader>
          <ModalBody>
            <VStack spacing={3} alignItems="unset">
              {basket.length ? (
                <>
                  {basket.map(({ artistName, imageUrl, price, releaseId, title }) => (
                    <Flex key={releaseId} alignItems="center">
                      <Avatar name={title} src={imageUrl} mr={4} />
                      <Text as={RouterLink} to={`/release/${releaseId}`}>
                        {artistName} &bull; <Text as="em">{title}</Text>
                      </Text>
                      <Spacer />
                      <Box mr={4}>◈ {Number(utils.formatEther(price)).toFixed(2)}</Box>
                      <IconButton
                        aria-label="Remove item from the basket."
                        icon={<Icon icon={faTimes} />}
                        onClick={() => dispatch(removeFromBasket(releaseId))}
                      />
                    </Flex>
                  ))}
                  <Flex>
                    <Box mr={4}>Total</Box>
                    <Spacer />
                    <Box>◈ {Number(utils.formatEther(total)).toFixed(2)}</Box>
                  </Flex>
                </>
              ) : (
                <Text>
                  Checkout a whole basket of releases with a single transaction. Add a release to get started!
                </Text>
              )}
            </VStack>
            <Divider mt={4} />
          </ModalBody>
          <ModalFooter>
            <Button onClick={handleCloseModal}>Close</Button>
            <Button
              colorScheme={useColorModeValue("yellow", "purple")}
              leftIcon={<Icon icon={faEthereum} />}
              isDisabled={!basket.length || isCheckingOut || isFetchingAllowance}
              isLoading={isCheckingOut}
              loadingText="Checking out…"
              onClick={!isConnected ? handleConnect : allowanceTooLow ? handleNavigateToPayment : handleCheckout}
              ml="auto"
            >
              {!isConnected
                ? "Connect wallet"
                : allowanceTooLow
                ? "Approval required"
                : `Checkout ~ ${Number(utils.formatEther(total)).toFixed(2)} USD`}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default BasketButton;