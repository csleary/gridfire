import {
  Button,
  Center,
  Divider,
  Heading,
  Input,
  InputGroup,
  InputLeftElement,
  Link,
  TableContainer,
  Table,
  TableCaption,
  Text,
  Thead,
  Td,
  Tr,
  Th,
  Tbody,
  useColorModeValue
} from "@chakra-ui/react";
import { useDispatch, useSelector } from "hooks";
import { ChangeEventHandler, MouseEventHandler, useEffect, useState } from "react";
import { PurchaseHistory } from "types";
import { getGridFirePurchaseEvents } from "web3/contract";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import { formatEther } from "ethers";
import Icon from "components/icon";
import { addPaymentAddress } from "state/user";
import { faEthereum } from "@fortawesome/free-brands-svg-icons";

const defaultErrorState = {
  paymentAddress: ""
};

const PaymentAddress = () => {
  const dispatch = useDispatch();
  const paymentAddress = useSelector(state => state.user.paymentAddress);
  const [errors, setError] = useState(defaultErrorState);
  const [isPristine, setIsPristine] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [purchases, setPurchases] = useState<PurchaseHistory>([]);
  const [address, setAddress] = useState(paymentAddress);
  const hasErrors = Object.values(errors).some(error => Boolean(error));
  const hasChanged = address !== paymentAddress;

  // Fetch payments received.
  useEffect(() => {
    if (paymentAddress) {
      getGridFirePurchaseEvents().then(setPurchases);
    }
  }, [paymentAddress]);

  const handleChange: ChangeEventHandler<HTMLInputElement> = e => {
    const { value } = e.currentTarget;
    setIsPristine(false);
    setError({ ...defaultErrorState, paymentAddress: "" });
    setAddress(value);
  };

  const handleSubmit: MouseEventHandler<HTMLButtonElement> = async e => {
    e.preventDefault();
    setIsSubmitting(true);
    dispatch(addPaymentAddress({ paymentAddress: address })).then(() => setIsSubmitting(false));
  };

  return (
    <>
      <Heading fontWeight={300} mb={8} textAlign="center">
        Payment Address
      </Heading>
      <InputGroup mb={8}>
        <InputLeftElement
          children={<Icon icon={faEthereum} />}
          color="purple.300"
          fontSize="1.5em"
          pointerEvents="none"
          top=".25rem"
        />
        <Input
          bg={useColorModeValue("white", "gray.400")}
          isDisabled={isSubmitting}
          isInvalid={Boolean(errors.paymentAddress)}
          fontSize="1.5rem"
          name="paymentAddress"
          onChange={handleChange}
          placeholder="0x…"
          size="lg"
          textAlign="center"
          value={address}
        />
      </InputGroup>
      <Center mb={8}>
        <Button
          leftIcon={<Icon icon={faCheck} />}
          isDisabled={Boolean(hasErrors) || !hasChanged || isPristine}
          isLoading={isSubmitting}
          onClick={handleSubmit}
        >
          Save Address
        </Button>
      </Center>
      <Text mb={12}>
        This is the address to which music sales payments and rewards will be sent. By default this is also the address
        you used to sign in, but it can be updated to any address or ENS domain.
      </Text>
      <Divider mb={12} />
      <Heading fontWeight={300} mb={12} textAlign="center">
        Sales History
      </Heading>
      <TableContainer>
        <Table variant="simple">
          <TableCaption placement="top">DAI Payments received from sales</TableCaption>
          <Thead>
            <Tr>
              <Th>Block</Th>
              <Th>From Address</Th>
              <Th isNumeric>Fee</Th>
              <Th isNumeric>Net</Th>
            </Tr>
          </Thead>
          <Tbody>
            {purchases.map(
              ({ blockNumber, buyer, editionId, releaseId, artistShare, platformFee, transactionHash }) => (
                <Tr key={`${transactionHash}.${releaseId}`}>
                  <Td>
                    <Link href={`https://arbiscan.io/tx/${transactionHash}`}>{blockNumber}</Link>
                  </Td>
                  <Td>
                    {buyer.slice(0, 6)}…{buyer.slice(-4)}
                  </Td>
                  <Td isNumeric>◈ {Number(formatEther(platformFee)).toFixed(2)}</Td>
                  <Td isNumeric>◈ {Number(formatEther(artistShare)).toFixed(2)}</Td>
                </Tr>
              )
            )}
          </Tbody>
        </Table>
      </TableContainer>
    </>
  );
};

export default PaymentAddress;
