import {
  Alert,
  AlertIcon,
  AlertDescription,
  Button,
  ButtonGroup,
  Divider,
  Flex,
  Heading,
  Input,
  InputGroup,
  InputLeftAddon,
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
import { ethers, utils } from "ethers";
import { getDaiApprovalEvents, setDaiAllowance } from "web3/contract";
import { shallowEqual, useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import Icon from "components/icon";
import { faEthereum } from "@fortawesome/free-brands-svg-icons";
import { faWallet } from "@fortawesome/free-solid-svg-icons";
import { fetchDaiAllowance } from "state/web3";
import { toastSuccess } from "state/toast";

const Allowance = () => {
  const dispatch = useDispatch();
  const { web3 } = useSelector(state => state, shallowEqual);
  const { account, accountShort, daiAllowance, isConnected, isFetchingAllowance } = web3;
  const [error, setError] = useState("");
  const [approvals, setApprovals] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [allowance, setAllowance] = useState();

  useEffect(() => {
    if (account) {
      dispatch(fetchDaiAllowance(account));
    }
  }, [account, dispatch]);

  useEffect(() => {
    if (daiAllowance) {
      setAllowance(Number(utils.formatEther(daiAllowance)).toFixed(2));
    }
  }, [daiAllowance]);

  useEffect(() => {
    if (account) {
      getDaiApprovalEvents(account).then(setApprovals);
    }
  }, [account]);

  const handleChange = e => {
    const { value } = e.target;
    setError("");
    setAllowance(value);
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
      const error = validate(allowance);
      if (error) return setError(error);
      setIsSubmitting(true);
      await setDaiAllowance(allowance);
      dispatch(fetchDaiAllowance(account));

      dispatch(
        toastSuccess({
          message: `New DAI spending limit set to ◈ ${allowance}. Happy shopping!`,
          title: "Success"
        })
      );

      getDaiApprovalEvents(account).then(setApprovals);
      setShowModal(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setAllowance(utils.formatEther(daiAllowance));
  };

  const handleAddAmount = amount => () => {
    setAllowance(prev => (Number(prev) + amount).toFixed(2));
  };

  return (
    <>
      <Heading fontWeight={300} mb={8} textAlign="center">
        DAI Spending Allowance
      </Heading>
      <Flex
        bg={useColorModeValue("white", "gray.800")}
        borderWidth="1px"
        borderColor={useColorModeValue("gray.200", "gray.700")}
        boxShadow="md"
        flexDirection="column"
        rounded="lg"
        mb={8}
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
      <Text mb={8}>
        Each account you connect with GridFire has a DAI spending allowance, as a security measure to limit the amount a
        contract can spend on your behalf. Once this allowance reaches zero, another limit must be approved before
        further paymenta can be made. As this request costs gas, we advise setting a reasonable budget to avoid
        inconvenience.
      </Text>
      <Divider mb={12} />
      <Heading fontWeight={300} mb={8} textAlign="center">
        DAI Approval History
      </Heading>
      <TableContainer>
        <Table variant="simple">
          <TableCaption placement="top">GridFire DAI approvals for the connected account</TableCaption>
          <Thead>
            <Tr>
              <Th>Block</Th>
              <Th isNumeric>Amount</Th>
            </Tr>
          </Thead>
          <Tbody>
            {approvals.map(({ args, blockNumber, transactionHash }) => {
              const approvalAmount = args[2];

              return (
                <Tr key={transactionHash}>
                  <Td>
                    <Link href={`https://arbiscan.io/tx/${transactionHash}`}>{blockNumber}</Link>
                  </Td>
                  <Td isNumeric>◈ {Number(utils.formatEther(approvalAmount)).toFixed(2)}</Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      </TableContainer>
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
                isInvalid={error}
                label={"Set payment allowance"}
                min={0}
                name="allowance"
                onChange={handleChange}
                textAlign="center"
                title=""
                type="number"
                value={allowance}
              />
              <InputRightAddon children="DAI" />
            </InputGroup>
            <ButtonGroup variant="outline" spacing="4" display="flex" justifyContent="center" mb="6">
              <Button isDisabled={isSubmitting} onClick={handleAddAmount(100)}>
                +100
              </Button>
              <Button isDisabled={isSubmitting} onClick={handleAddAmount(500)}>
                +500
              </Button>
              <Button isDisabled={isSubmitting} onClick={handleAddAmount(1000)}>
                +1000
              </Button>
              <Button isDisabled={isSubmitting} onClick={handleAddAmount(5000)}>
                +5000
              </Button>
            </ButtonGroup>
            <Text mb={4}>
              The higher the value, the more purchases you will be able to make without having to make further
              approvals. When you hit confirm, you will be prompted to make a small transaction to set your new
              allowance.
            </Text>
            {error ? (
              <Alert status="error" variant="solid">
                <AlertIcon color="red.500" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
          </ModalBody>
          <ModalFooter>
            <Button onClick={handleCloseModal}>Cancel</Button>
            <Button
              colorScheme={useColorModeValue("yellow", "purple")}
              leftIcon={<Icon icon={faEthereum} />}
              isDisabled={isSubmitting}
              isLoading={isSubmitting}
              loadingText="Confirming…"
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

export default Allowance;
