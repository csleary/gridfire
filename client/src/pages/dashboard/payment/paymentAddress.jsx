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
import { getGridFireContract } from "web3/contract";
import { utils } from "ethers";
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import { useContext, useEffect, useState } from "react";
import GridFirePayment from "web3/GridFirePayment.json";
import Icon from "components/icon";
import { addPaymentAddress } from "state/user";
import { faEthereum } from "@fortawesome/free-brands-svg-icons";
import { Web3Context } from "index";

const PaymentAddress = () => {
  const provider = useContext(Web3Context);
  const dispatch = useDispatch();
  const { user } = useSelector(state => state, shallowEqual);
  const { paymentAddress } = user;
  const [errors, setError] = useState({});
  const [isPristine, setIsPristine] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [purchases, setPurchases] = useState([]);
  const [address, setAddress] = useState(paymentAddress);
  const hasErrors = Object.values(errors).some(error => Boolean(error));
  const hasChanged = address !== paymentAddress;
  const gridFireInterface = new utils.Interface(GridFirePayment.abi);

  // Fetch payments received.
  useEffect(() => {
    const fetch = async () => {
      const gridFire = getGridFireContract(provider);
      const purchaseFilter = gridFire.filters.Purchase(null, paymentAddress);
      const purchases = await gridFire.queryFilter(purchaseFilter);
      setPurchases(purchases);
    };

    if (paymentAddress && provider) {
      fetch();
    }
  }, [paymentAddress, provider]);

  const handleChange = e => {
    const { value } = e.target;
    setIsPristine(false);
    setError("");
    setAddress(value);
  };

  const handleSubmit = async e => {
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
          error={errors.paymentAddress}
          fontSize="1.5rem"
          label={"Your ETH payment address"}
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
        This is the address which payments and rewards will be sent to, if selling music. By default this is also the
        address you used to sign in, but it can by any address or ENS domain.
      </Text>
      <Divider mb={12} />
      <Heading fontWeight={300} mb={12} textAlign="center">
        Payment History
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
            {purchases.map(event => {
              const { blockNumber, transactionHash } = event;
              const { args } = gridFireInterface.parseLog(event);
              const { buyer, amount, fee } = args;

              return (
                <Tr key={transactionHash}>
                  <Td>
                    <Link href={`https://etherscan.io/tx/${transactionHash}`}>{blockNumber}</Link>
                  </Td>
                  <Td>
                    {buyer.slice(0, 6)}…{buyer.slice(-4)}
                  </Td>
                  <Td isNumeric>◈ {Number(utils.formatEther(fee)).toFixed(2)}</Td>
                  <Td isNumeric>◈ {Number(utils.formatEther(amount)).toFixed(2)}</Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      </TableContainer>
    </>
  );
};

export default PaymentAddress;
