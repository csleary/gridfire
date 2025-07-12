import {
  Alert,
  AlertDescription,
  AlertIcon,
  Button,
  ButtonGroup,
  Divider,
  Input,
  InputGroup,
  InputLeftAddon,
  InputRightAddon,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  useColorModeValue
} from "@chakra-ui/react";
import { faEthereum } from "@fortawesome/free-brands-svg-icons";
import { FormEvent, useCallback, useState } from "react";

import Icon from "@/components/icon";
import { formatPrice } from "@/utils";

const INFO_TEXT = "Enter the amount you wish to pay for this release.";
const SUBMIT_INFO = "When you hit 'buy now', you will be prompted by your web3 wallet to finalise the payment.";
const SUBMIT_BUTTON = "Buy Now";
const SUBMIT_BUTTON_LOADING = "Purchasing…";

interface Props {
  handleCloseModal: () => void;
  handleSubmit: (price: string) => Promise<void>;
  info?: string;
  initialPrice: string;
  isSubmitting: boolean;
  showModal: boolean;
  submitButton?: string;
  submitButtonLoading?: string;
  submitInfo?: string;
}

const NameYourPriceModal = ({
  handleCloseModal,
  handleSubmit,
  info = INFO_TEXT,
  initialPrice,
  isSubmitting = false,
  showModal,
  submitButton = SUBMIT_BUTTON,
  submitButtonLoading = SUBMIT_BUTTON_LOADING,
  submitInfo = SUBMIT_INFO
}: Props) => {
  const [error, setError] = useState("");
  const [price, setPrice] = useState(initialPrice);

  const handleNameYourPricePayment = async () => {
    await handleSubmit(price);
    handleCloseModal();
  };

  const handleChange = useCallback(
    ({ currentTarget: { value } }: FormEvent<HTMLInputElement>) => {
      setError("");
      const numbersOnly = value.replace(/[^0-9.]/g, "");
      setPrice(numbersOnly);
    },
    [setError, setPrice]
  );

  const handleBlur = () => {
    setPrice(formatPrice);
  };

  const handleAddAmount = (amount: number) => () => {
    setError("");
    setPrice(prev => (Number(prev) + amount).toFixed(2));
  };

  return (
    <Modal isCentered isOpen={showModal} onClose={handleCloseModal} size="sm">
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
        <ModalHeader>Name Your Price</ModalHeader>
        <ModalBody>
          <Text mb={8}>{info}</Text>
          <InputGroup fontSize="1.5rem" mb={4} size="lg">
            <InputLeftAddon>◈</InputLeftAddon>
            <Input
              autoFocus
              inputMode="numeric"
              isDisabled={isSubmitting}
              isInvalid={Boolean(error)}
              min={0}
              name="allowance"
              onBlur={handleBlur}
              onChange={handleChange}
              textAlign="center"
              title=""
              value={price}
              variant="modal"
            />
            <InputRightAddon>DAI</InputRightAddon>
          </InputGroup>
          <ButtonGroup display="flex" justifyContent="center" mb="6" spacing="4" variant="outline">
            <Button isDisabled={isSubmitting} onClick={handleAddAmount(1)}>
              +1
            </Button>
            <Button isDisabled={isSubmitting} onClick={handleAddAmount(5)}>
              +5
            </Button>
            <Button isDisabled={isSubmitting} onClick={handleAddAmount(10)}>
              +10
            </Button>
            <Button isDisabled={isSubmitting} onClick={handleAddAmount(20)}>
              +20
            </Button>
          </ButtonGroup>
          {submitInfo ? <Text mb={4}>{submitInfo}</Text> : null}
          {error ? (
            <Alert status="error" variant="solid">
              <AlertIcon color="red.500" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <Divider borderColor={useColorModeValue("gray.200", "gray.500")} mt={8} />
        </ModalBody>
        <ModalFooter>
          <Button onClick={handleCloseModal}>Cancel</Button>
          <Button
            colorScheme={useColorModeValue("yellow", "purple")}
            isDisabled={isSubmitting}
            isLoading={isSubmitting}
            leftIcon={<Icon icon={faEthereum} />}
            loadingText={submitButtonLoading}
            ml="auto"
            onClick={handleNameYourPricePayment}
          >
            {submitButton}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default NameYourPriceModal;
