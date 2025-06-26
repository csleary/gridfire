import Icon from "@/components/icon";
import { useDispatch, useSelector } from "@/hooks";
import { checkoutBasket, connectToWeb3, emptyBasket, fetchDaiBalance, removeFromBasket } from "@/state/web3";
import { BasketItem } from "@/types";
import {
  Avatar,
  AvatarGroup,
  Box,
  Button,
  Divider,
  Flex,
  IconButton,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spacer,
  Text,
  VStack,
  useColorModeValue
} from "@chakra-ui/react";
import { faEthereum } from "@fortawesome/free-brands-svg-icons";
import { faShoppingBasket, faTimes } from "@fortawesome/free-solid-svg-icons";
import { formatEther } from "ethers";
import { useState } from "react";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";

const BasketButton = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const account = useSelector(state => state.web3.account);
  const basket = useSelector(state => state.web3.basket);
  const daiAllowance = useSelector(state => state.web3.daiAllowance);
  const isCheckingOut = useSelector(state => state.web3.isCheckingOut);
  const isConnected = useSelector(state => state.web3.isConnected);
  const isFetchingAllowance = useSelector(state => state.web3.isFetchingAllowance);
  const [showModal, setShowModal] = useState(false);
  const total = basket.reduce((prev, { price }: BasketItem) => prev + BigInt(price), BigInt("0"));
  const allowanceTooLow = total > BigInt(daiAllowance);

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
    const { pathname } = location;
    navigate("/dashboard/payment/approvals", { state: { pathname } });
  };

  return (
    <>
      <Button
        aria-label="Show the contents of your basket."
        leftIcon={<Icon fixedWidth icon={faShoppingBasket} />}
        iconSpacing={0}
        onClick={() => setShowModal(true)}
        px={2}
      >
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
                      <Box mr={4}>◈ {Number(formatEther(price)).toFixed(2)}</Box>
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
                    <Box>◈ {Number(formatEther(total)).toFixed(2)}</Box>
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
                : `Checkout ~ ${Number(formatEther(total)).toFixed(2)} USD`}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default BasketButton;
