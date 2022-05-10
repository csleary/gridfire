import {
  Button,
  Container,
  Flex,
  Heading,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightAddon,
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
  StatNumber,
  useColorModeValue
} from "@chakra-ui/react";
import { ethers, utils } from "ethers";
import { faCheck, faWallet } from "@fortawesome/free-solid-svg-icons";
import { getDaiContract, getGridFireContract, setDaiAllowance } from "web3/contract";
import { useContext, useEffect, useState } from "react";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import { toastError, toastInfo, toastSuccess } from "state/toast";
import Icon from "components/icon";
import { Web3Context } from "index";
import { daiAbi } from "web3/dai";
import { fetchUserReleases } from "state/releases";
import { fetchDaiAllowance } from "state/web3";
import { addPaymentAddress } from "state/user";
import { faEthereum } from "@fortawesome/free-brands-svg-icons";

const Address = () => {
  const provider = useContext(Web3Context);
  const dispatch = useDispatch();
  const { user, web3 } = useSelector(state => state, shallowEqual);
  const { paymentAddress } = user;
  const { account, accountShort, daiAllowance, isConnected, isFetchingAllowance } = web3;
  const [balance, setBalance] = useState(utils.parseEther("0"));
  const [errors, setErrors] = useState({});
  const [isPristine, setIsPristine] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [values, setValues] = useState({ paymentAddress });
  const hasErrors = Object.values(errors).some(error => Boolean(error));
  const hasChanged = values.paymentAddress !== paymentAddress;
  const contract = getGridFireContract(provider);

  // Fetch payments received.
  useEffect(() => {
    const fetch = async () => {
      const dai = getDaiContract(provider);
      const iface = new utils.Interface(daiAbi);
      const filter = dai.filters.Transfer(null, paymentAddress); // DAI transfers *to* my account.
      const events = await dai.queryFilter(filter);

      events.forEach(event => {
        console.log(iface.parseLog(event));
        const { args, name } = iface.parseLog(event);
        const [from, to, bigNum] = args;
        const amount = utils.formatEther(bigNum);
        console.log(name, from, to, amount);
      });
    };

    if (paymentAddress && provider) {
      fetch();
    }
  }, [paymentAddress, provider]);

  useEffect(() => {
    dispatch(fetchUserReleases());
  }, [dispatch]);

  useEffect(() => {
    if (account) dispatch(fetchDaiAllowance(account));
  }, [account, dispatch]);

  useEffect(() => {
    contract.getBalance(paymentAddress).then(setBalance).catch(console.error);
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

  const handleApproval = async () => {
    try {
      const newLimitInDai = `${values.allowance}` || "";
      await setDaiAllowance(newLimitInDai);
      dispatch(fetchDaiAllowance(account));
      setShowModal(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setValues(prev => ({ ...prev, allowance: ethers.utils.formatEther(daiAllowance) }));
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
          mb={16}
          p={4}
        >
          <Stat>
            <StatLabel textAlign="center">Current DAI balance</StatLabel>
            <StatNumber fontSize="4xl" textAlign="center">
              ◈ {Number(ethers.utils.formatEther(balance)).toFixed(2)}
            </StatNumber>
          </Stat>
        </Flex>
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
              <Input
                autoFocus
                bgColor={useColorModeValue("white", "gray.800")}
                isDisabled={isSubmitting}
                label={"Set payment allowance"}
                min={0}
                name="allowance"
                onChange={handleChange}
                textAlign="center"
                type="number"
                value={values.allowance || ethers.utils.formatEther(daiAllowance)}
              />
              <InputRightAddon children="DAI" />
            </InputGroup>
            <Text mb={8}>
              The high the value, the more purchases you can make without having to make further approvals. Once you hit
              confirm, you will be prompted to make a transaction to set your new allowance.
            </Text>
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
