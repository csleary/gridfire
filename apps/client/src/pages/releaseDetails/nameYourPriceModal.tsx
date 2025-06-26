import Icon from "@/components/icon";
import { formatPrice } from "@/utils";
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

const INFO_TEXT = "Enter the amount you wish to pay for this release.";
const SUBMIT_INFO = "When you hit 'buy now', you will be prompted by your web3 wallet to finalise the payment.";
const SUBMIT_BUTTON = "Buy Now";
const SUBMIT_BUTTON_LOADING = "Purchasing…";

interface Props {
  initialPrice: string;
  isSubmitting: boolean;
  handleCloseModal: () => void;
  handleSubmit: (price: string) => Promise<void>;
  info?: string;
  showModal: boolean;
  submitInfo?: string;
  submitButton?: string;
  submitButtonLoading?: string;
}

const NameYourPriceModal = ({
  initialPrice,
  isSubmitting = false,
  handleCloseModal,
  handleSubmit,
  info = INFO_TEXT,
  showModal,
  submitInfo = SUBMIT_INFO,
  submitButton = SUBMIT_BUTTON,
  submitButtonLoading = SUBMIT_BUTTON_LOADING
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
    <Modal isOpen={showModal} onClose={handleCloseModal} size="sm" isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalCloseButton />
        <ModalHeader>Name Your Price</ModalHeader>
        <ModalBody>
          <Text mb={8}>{info}</Text>
          <InputGroup mb={4} fontSize="1.5rem" size="lg">
            <InputLeftAddon children="◈" />
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
            <InputRightAddon children="DAI" />
          </InputGroup>
          <ButtonGroup variant="outline" spacing="4" display="flex" justifyContent="center" mb="6">
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
            leftIcon={<Icon icon={faEthereum} />}
            isDisabled={isSubmitting}
            isLoading={isSubmitting}
            loadingText={submitButtonLoading}
            onClick={handleNameYourPricePayment}
            ml="auto"
          >
            {submitButton}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default NameYourPriceModal;
