import {
  Alert,
  AlertDescription,
  Button,
  Divider,
  Flex,
  FormControl,
  FormHelperText,
  Heading,
  Input,
  InputGroup,
  InputLeftElement,
  Link,
  Table,
  TableCaption,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue
} from "@chakra-ui/react";
import { faEthereum } from "@fortawesome/free-brands-svg-icons";
import { faCheck, faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import { formatEther, getAddress, isAddress } from "ethers";
import { ChangeEventHandler, useCallback, useEffect, useState } from "react";

import Icon from "@/components/icon";
import { useDispatch, useSelector } from "@/hooks";
import { addPaymentAddress } from "@/state/user";
import { fetchSales } from "@/state/web3";
import { fetchResolvedAddress } from "@/web3";

const PaymentAddress = () => {
  const errorAlertColor = useColorModeValue("red.800", "red.200");
  const dispatch = useDispatch();
  const paymentAddress = useSelector(state => state.user.paymentAddress);
  const salesHistory = useSelector(state => state.web3.sales);
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [isPristine, setIsPristine] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasChanged = address !== paymentAddress;

  useEffect(() => {
    if (paymentAddress) {
      setAddress(paymentAddress);
    }
  }, [paymentAddress]);

  useEffect(() => {
    if (paymentAddress) {
      dispatch(fetchSales());
    }
  }, [dispatch, paymentAddress]);

  const handleChange: ChangeEventHandler<HTMLInputElement> = e => {
    const { value } = e.currentTarget;
    setIsPristine(false);
    setError("");
    setAddress(value);
  };

  const saveAddress = useCallback(async () => {
    try {
      let proposedAddress = address.trim();

      if (!proposedAddress) {
        setError("Please enter a payment address or ENS domain.");
        return;
      }

      setIsSubmitting(true);

      if (isAddress(proposedAddress)) {
        try {
          getAddress(proposedAddress);
        } catch (error) {
          setError("Please enter a valid payment address.");
          return;
        }
      } else {
        try {
          proposedAddress = await fetchResolvedAddress(proposedAddress);
        } catch (error) {
          setError("Please enter a valid payment address or ENS domain.");
          return;
        }
      }

      const updatedAddress = await dispatch(addPaymentAddress(proposedAddress));

      if (updatedAddress) {
        setAddress(updatedAddress);
        dispatch(fetchSales());
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [address, dispatch]);

  return (
    <>
      <Heading fontWeight={300} mb={8} textAlign="center">
        Payment Address
      </Heading>
      <FormControl isInvalid={Boolean(error)} mb={8}>
        <InputGroup>
          <InputLeftElement color="purple.300" fontSize="1.5em" pointerEvents="none" top=".25rem">
            <Icon icon={faEthereum} />
          </InputLeftElement>
          <Input
            bg={useColorModeValue("white", "gray.400")}
            fontSize="1.5rem"
            isDisabled={isSubmitting}
            isInvalid={Boolean(error)}
            name="paymentAddress"
            onChange={handleChange}
            onKeyDown={e => {
              if (e.key === "Enter") {
                saveAddress();
              }
            }}
            placeholder="0x…"
            size="lg"
            textAlign="center"
            value={address}
          />
        </InputGroup>
        {error ? (
          <Alert mt={2} status="error">
            <Icon color={errorAlertColor} fixedWidth icon={faTriangleExclamation} mr={3} />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <FormHelperText>We will normalise your address and attempt to resolve any ENS domains.</FormHelperText>
        )}
      </FormControl>
      <Flex justifyContent="flex-end" mb={8}>
        <Button
          isDisabled={Boolean(error) || !hasChanged || isPristine}
          isLoading={isSubmitting}
          leftIcon={<Icon icon={faCheck} />}
          loadingText="Saving…"
          onClick={() => saveAddress()}
        >
          Save Address
        </Button>
      </Flex>
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
            {salesHistory.map(({ artistShare, blockNumber, logIndex, platformFee, transactionHash, userAddress }) => (
              <Tr key={`${transactionHash}-${logIndex}`}>
                <Td>
                  <Link href={`https://arbiscan.io/tx/${transactionHash}`}>{blockNumber}</Link>
                </Td>
                <Td>
                  {userAddress.slice(0, 6)}…{userAddress.slice(-4)}
                </Td>
                <Td isNumeric>◈ {Number(formatEther(platformFee)).toFixed(2)}</Td>
                <Td isNumeric>◈ {Number(formatEther(artistShare)).toFixed(2)}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
    </>
  );
};

export default PaymentAddress;
