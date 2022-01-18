import {
  Button,
  Container,
  Flex,
  Heading,
  Input,
  InputGroup,
  InputLeftElement,
  Text,
  Stat,
  StatArrow,
  StatHelpText,
  StatLabel,
  StatNumber
} from "@chakra-ui/react";
import { Contract, ethers } from "ethers";
import { useContext, useEffect, useState } from "react";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import { toastError, toastInfo, toastSuccess } from "features/toast";
import GridFirePayment from "contracts/GridFirePayment.json";
import Icon from "components/icon";
import { Web3Context } from "index";
import { addPaymentAddress } from "features/user";
import detectEthereumProvider from "@metamask/detect-provider";
import { faCheck, faWallet } from "@fortawesome/free-solid-svg-icons";
import { fetchUserReleases } from "features/releases";
import { faEthereum } from "@fortawesome/free-brands-svg-icons";

const { REACT_APP_CONTRACT_ADDRESS } = process.env;

const Address = () => {
  const provider = useContext(Web3Context);
  const dispatch = useDispatch();
  const { paymentAddress } = useSelector(state => state.user, shallowEqual);
  const [balance, setBalance] = useState(ethers.utils.parseEther("0"));
  const [errors, setErrors] = useState({});
  const [isPristine, setIsPristine] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [values, setValues] = useState({ paymentAddress });
  const hasErrors = Object.values(errors).some(error => Boolean(error));
  const hasChanged = values.paymentAddress !== paymentAddress;
  const contract = new Contract(REACT_APP_CONTRACT_ADDRESS, GridFirePayment.abi, provider);

  useEffect(() => {
    dispatch(fetchUserReleases());
  }, [dispatch]);

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

  const handleClaimBalance = async () => {
    try {
      setIsClaiming(true);
      const ethereum = await detectEthereumProvider();
      const signer = new ethers.providers.Web3Provider(ethereum).getSigner();
      const upgradedContract = contract.connect(signer);
      const transactionReceipt = await upgradedContract.claim();
      await transactionReceipt.wait(0);
      contract.getBalance(paymentAddress).then(setBalance);
      dispatch(toastSuccess("Balance claimed successfully"));
    } catch (error) {
      if (ethers.utils.formatUnits(balance, 18) === "0.0") {
        return void dispatch(toastInfo("Nothing to claim."));
      }
      dispatch(toastError(error.message));
    } finally {
      setIsClaiming(false);
    }
  };

  const balanceIsZero = balance._hex === "0x00";

  return (
    <Container as="main" maxW="container.sm" p={0}>
      <Heading fontWeight={300} mb={8} textAlign="center">
        Payment Address
      </Heading>
      <Text mb={8}>
        Please add an ETH payment address if you wish to sell music. By default this is the address you used to sign in,
        but it can by any address or ENS domain.
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
          bg="white"
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
        bg="white"
        borderWidth="1px"
        borderColor="gray.200"
        boxShadow="md"
        flexDirection="column"
        rounded="lg"
        p={4}
      >
        <Stat mb={4}>
          <StatLabel textAlign="center">Current balance</StatLabel>
          <StatNumber fontSize="4xl" textAlign="center">
            {balanceIsZero ? "0.00" : ethers.utils.formatUnits(balance, "ether")}
          </StatNumber>
          {/* <StatHelpText>
            <StatArrow type="increase" />
            23.36% Since last month
          </StatHelpText> */}
        </Stat>
        <Text></Text>
        <Button
          leftIcon={<Icon color="gray.500" icon={faWallet} />}
          isDisabled={balanceIsZero}
          isLoading={isClaiming}
          loadingText="Claiming…"
          onClick={handleClaimBalance}
        >
          {isClaiming ? "Claiming…" : "Claim balance"}
        </Button>
      </Flex>
    </Container>
  );
};

export default Address;
