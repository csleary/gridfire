import {
  Alert,
  AlertIcon,
  AlertDescription,
  Button,
  ButtonGroup,
  Container,
  Flex,
  Heading,
  Input,
  InputGroup,
  InputLeftAddon,
  InputLeftElement,
  InputRightAddon,
  Link,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  ModalHeader,
  Text,
  Stat,
  StatLabel,
  StatHelpText,
  StatNumber,
  TableContainer,
  Table,
  TableCaption,
  Thead,
  Td,
  Tr,
  Th,
  Tbody,
  useColorModeValue
} from "@chakra-ui/react";
import { claimBalance, getBalance, getGridFireContract, setDaiAllowance } from "web3/contract";
import { constants, ethers, utils } from "ethers";
import { faCheck, faWallet } from "@fortawesome/free-solid-svg-icons";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import { toastError, toastInfo, toastSuccess } from "state/toast";
import { useContext, useEffect, useState } from "react";
import GridFirePayment from "artifacts/contracts/GridFirePayment.sol/GridFirePayment.json";
import Icon from "components/icon";
import { addPaymentAddress } from "state/user";
import { faEthereum } from "@fortawesome/free-brands-svg-icons";
import { fetchDaiAllowance } from "state/web3";
import { fetchUserReleases } from "state/releases";
import { Web3Context } from "index";

const Address = () => {
  const provider = useContext(Web3Context);
  const dispatch = useDispatch();
  const { user, web3 } = useSelector(state => state, shallowEqual);
  const { paymentAddress } = user;
  const { account, accountShort, daiAllowance, isConnected, isFetchingAllowance } = web3;
  const [balance, setBalance] = useState(utils.parseEther("0"));
  const [errors, setErrors] = useState({});
  const [isClaiming, setIsClaiming] = useState(false);
  const [isPristine, setIsPristine] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [claims, setClaims] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [values, setValues] = useState({ paymentAddress });
  const hasErrors = Object.values(errors).some(error => Boolean(error));
  const hasChanged = values.paymentAddress !== paymentAddress;
  const gridFireInterface = new utils.Interface(GridFirePayment.abi);

  // Fetch payments received.
  useEffect(() => {
    const fetch = async () => {
      const gridFire = getGridFireContract(provider);
      const purchaseFilter = gridFire.filters.Purchase(null, paymentAddress);
      const purchases = await gridFire.queryFilter(purchaseFilter);
      setPurchases(purchases);
      const claimFilter = gridFire.filters.Claim(paymentAddress);
      const claims = await gridFire.queryFilter(claimFilter);
      setClaims(claims);
    };

    if (paymentAddress && provider) {
      fetch();
    }
  }, [balance, paymentAddress, provider]);

  useEffect(() => {
    dispatch(fetchUserReleases());
  }, [dispatch]);

  useEffect(() => {
    if (daiAllowance) {
      setValues(prev => ({ ...prev, allowance: Number(utils.formatEther(daiAllowance)).toFixed(2) }));
    }
  }, [daiAllowance]);

  useEffect(() => {
    getBalance(paymentAddress).then(setBalance).catch(console.error);
  }, [paymentAddress]); // eslint-disable-line

  const handleChange = e => {
    const { name, value } = e.target;
    setIsPristine(false);
    setErrors(({ [name]: error, ...rest }) => rest); // eslint-disable-line
    setValues(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setIsSubmitting(true);
    dispatch(addPaymentAddress(values)).then(() => setIsSubmitting(false));
  };

  const handleClaimBalance = async () => {
    try {
      setIsClaiming(true);
      await claimBalance();
      setBalance(constants.Zero);
      dispatch(toastSuccess({ message: "DAI balance claimed successfully", title: "Success! 🙌" }));
    } catch (error) {
      if (balance.isZero()) {
        return void dispatch(
          toastInfo({ message: "There's nothing to claim at the moment.", title: "Nothing to claim. 🤔" })
        );
      }

      dispatch(toastError({ message: error.message, title: "Error" }));
    } finally {
      setIsClaiming(false);
    }
  };

  const validate = value => {
    try {
      ethers.FixedNumber.fromString(value, "fixed128x18");
    } catch (e) {
      return "Invalid amount.";
    }
  };

  const handleApproval = async () => {
    try {
      const error = validate(values.allowance);
      if (error) return setErrors(prev => ({ ...prev, allowance: error }));
      await setDaiAllowance(values.allowance);
      dispatch(fetchDaiAllowance(account));

      dispatch(
        toastSuccess({
          message: `New DAI spending limit set to ◈ ${values.allowance}. Happy shopping!`,
          title: "Success"
        })
      );
      setShowModal(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setValues(prev => ({ ...prev, allowance: utils.formatEther(daiAllowance) }));
  };

  const handleAddAmount = amount => {
    console.log(typeof values.allowance);
    setValues(prev => ({ ...prev, allowance: (Number(prev.allowance) + amount).toFixed(2) }));
  };

  return (
    <>
      <Container as="main" maxW="container.sm" p={0}>
        <Heading fontWeight={300} mb={8} textAlign="center">
          Payment Receiving Address
        </Heading>
        <Text mb={8}>
          This is the address which payments and rewards will be sent to, if selling music. By default this is also the
          address you used to sign in, but it can by any address or ENS domain.
        </Text>
        <InputGroup mb={4}>
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
            value={values.paymentAddress}
          />
        </InputGroup>
        <Flex justifyContent="flex-end" mb={16}>
          <Button
            leftIcon={<Icon icon={faCheck} />}
            isDisabled={Boolean(hasErrors) || !hasChanged || isPristine}
            isLoading={isSubmitting}
            onClick={handleSubmit}
          >
            Save Address
          </Button>
        </Flex>
        <Flex
          bg={useColorModeValue("white", "gray.800")}
          borderWidth="1px"
          borderColor={useColorModeValue("gray.200", "gray.700")}
          boxShadow="md"
          flexDirection="column"
          rounded="lg"
          mb={4}
          p={4}
        >
          <Stat mb={4}>
            <StatLabel textAlign="center">Current DAI balance</StatLabel>
            <StatNumber fontSize="4xl" textAlign="center">
              ◈ {Number(utils.formatEther(balance)).toFixed(2)}
            </StatNumber>
            <StatHelpText textAlign="center">The claimable amount in your GridFire account</StatHelpText>
          </Stat>
          <Button
            colorScheme={useColorModeValue("yellow", "purple")}
            leftIcon={<Icon icon={faWallet} />}
            isDisabled={!isConnected || balance.isZero() || account.toLowerCase() !== paymentAddress.toLowerCase()}
            isLoading={isClaiming}
            loadingText="Claiming…"
            onClick={handleClaimBalance}
          >
            {!isConnected
              ? "Connect wallet"
              : account.toLowerCase() !== paymentAddress.toLowerCase()
              ? "Switch to payment account"
              : isClaiming
              ? "Claiming…"
              : "Claim balance"}
          </Button>
        </Flex>
        <TableContainer mb={16}>
          <Table variant="simple">
            <TableCaption placement="top">Claim History</TableCaption>
            <Thead>
              <Tr>
                <Th>Block</Th>
                <Th isNumeric>Amount</Th>
              </Tr>
            </Thead>
            <Tbody>
              {claims.map(event => {
                const { blockNumber, transactionHash } = event;
                const { args } = gridFireInterface.parseLog(event);
                const { amount } = args;

                return (
                  <Tr key={transactionHash}>
                    <Td>
                      <Link href={`https://etherscan.io/tx/${transactionHash}`}>{blockNumber}</Link>
                    </Td>
                    <Td isNumeric>◈ {Number(utils.formatEther(amount)).toFixed(2)}</Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        </TableContainer>
        <TableContainer mb={16}>
          <Table variant="simple">
            <TableCaption placement="top">DAI Payments received</TableCaption>
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
        <Heading fontWeight={300} mb={8} textAlign="center">
          Spending Allowance
        </Heading>
        <Text mb={8}>
          The connected address used for making payments has a DAI payment limit allowance as a security measure. This
          is the maximum amount you permit us to transfer when purchasing music. Once this allowance reaches zero,
          another limit must be approved before payment can be made. As this request costs gas, we advise setting a
          reasonable budget to avoid inconvenience.
        </Text>
        <Flex
          bg={useColorModeValue("white", "gray.800")}
          borderWidth="1px"
          borderColor={useColorModeValue("gray.200", "gray.700")}
          boxShadow="md"
          flexDirection="column"
          rounded="lg"
          mb={16}
          p={4}
        >
          <Stat mb={4}>
            <StatLabel textAlign="center">
              {isConnected ? `DAI allowance for account ${accountShort}` : "No account connected"}
            </StatLabel>
            <StatNumber fontSize="4xl" textAlign="center">
              ◈ {Number(utils.formatEther(daiAllowance)).toFixed(2)}
            </StatNumber>
            <StatHelpText textAlign="center">Will decrease with each GridFire purchase</StatHelpText>
          </Stat>
          <Button
            colorScheme={useColorModeValue("yellow", "purple")}
            disabled={!isConnected || isFetchingAllowance}
            leftIcon={<Icon icon={faWallet} />}
            onClick={() => setShowModal(true)}
          >
            {!isConnected ? "Connect wallet" : isFetchingAllowance ? "Fetching allowance…" : "Set new allowance"}
          </Button>
        </Flex>
      </Container>
      <Modal isOpen={showModal} onClose={handleCloseModal} size="sm" isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalHeader>Set DAI Allowance</ModalHeader>
          <ModalBody>
            <Text mb={8}>Enter your desired DAI spending allowance below.</Text>
            <InputGroup mb={4} fontSize="1.5rem" size="lg">
              <InputLeftAddon children="◈" />
              <Input
                autoFocus
                bgColor={useColorModeValue("white", "gray.800")}
                isDisabled={isSubmitting}
                isInvalid={errors.allowance}
                label={"Set payment allowance"}
                min={0}
                name="allowance"
                onChange={handleChange}
                textAlign="center"
                title=""
                type="number"
                value={values.allowance}
              />
              <InputRightAddon children="DAI" />
            </InputGroup>
            <ButtonGroup variant="outline" spacing="4" display="flex" justifyContent="center" mb="6">
              <Button onClick={() => handleAddAmount(100)}>+100</Button>
              <Button onClick={() => handleAddAmount(500)}>+500</Button>
              <Button onClick={() => handleAddAmount(1000)}>+1000</Button>
              <Button onClick={() => handleAddAmount(5000)}>+5000</Button>
            </ButtonGroup>
            <Text mb={4}>
              The higher the value, the more purchases you will be able to make without having to make further
              approvals. When you hit confirm, you will be prompted to make a small transaction to set your new
              allowance.
            </Text>
            {errors.allowance ? (
              <Alert status="error" variant="solid">
                <AlertIcon color="red.500" />
                <AlertDescription>{errors.allowance}</AlertDescription>
              </Alert>
            ) : null}
          </ModalBody>
          <ModalFooter>
            <Button onClick={handleCloseModal}>Cancel</Button>
            <Button
              colorScheme={useColorModeValue("yellow", "purple")}
              leftIcon={<Icon icon={faEthereum} />}
              isDisabled={false}
              isLoading={false}
              onClick={handleApproval}
              ml="auto"
            >
              Confirm
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default Address;
