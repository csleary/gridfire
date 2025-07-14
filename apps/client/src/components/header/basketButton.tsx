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
  useColorModeValue,
  VStack
} from "@chakra-ui/react";
import { faEthereum } from "@fortawesome/free-brands-svg-icons";
import { faShoppingBasket, faTimes } from "@fortawesome/free-solid-svg-icons";
import { BasketItem } from "@gridfire/shared/types";
import { formatEther } from "ethers";
import { useState } from "react";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";

import Icon from "@/components/icon";
import { useDispatch, useSelector } from "@/hooks";
import { checkoutBasket, connectToWeb3, emptyBasket, fetchDaiBalance, removeFromBasket } from "@/state/web3";

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
  const total = basket.reduce((prev, { price }: BasketItem) => prev + price, 0n);
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
        iconSpacing={0}
        leftIcon={<Icon fixedWidth icon={faShoppingBasket} />}
        onClick={() => setShowModal(true)}
        px={2}
      >
        {basket.length ? (
          <AvatarGroup max={5} ml={2} size="xs">
            {basket.map(({ imageUrl, releaseId, title }) => (
              <Avatar key={releaseId} loading="lazy" name={title} src={imageUrl} />
            ))}
          </AvatarGroup>
        ) : null}
      </Button>
      <Modal isCentered isOpen={showModal} onClose={handleCloseModal} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalHeader>Your Basket</ModalHeader>
          <ModalBody>
            <VStack alignItems="unset" spacing={3}>
              {basket.length ? (
                <>
                  {basket.map(({ artistName, imageUrl, price, releaseId, title }) => (
                    <Flex alignItems="center" key={releaseId}>
                      <Avatar mr={4} name={title} src={imageUrl} />
                      <Text as={RouterLink} to={`/release/${releaseId}`}>
                        {artistName} &bull; <Text as="em">{title}</Text>
                      </Text>
                      <Spacer />
                      <Box __css={{ textWrapMode: "nowrap" }} mr={4}>
                        ◈ {Number(formatEther(price)).toFixed(2)}
                      </Box>
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
              isDisabled={!basket.length || isCheckingOut || isFetchingAllowance}
              isLoading={isCheckingOut}
              leftIcon={<Icon icon={faEthereum} />}
              loadingText="Checking out…"
              ml="auto"
              onClick={!isConnected ? handleConnect : allowanceTooLow ? handleNavigateToPayment : handleCheckout}
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
