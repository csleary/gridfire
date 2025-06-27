import Icon from "@/components/icon";
import { useDispatch, useSelector } from "@/hooks";
import { useLazyGetApprovalsQuery, useLazyGetPurchasesQuery } from "@/state/logs";
import { toastSuccess } from "@/state/toast";
import { fetchDaiAllowance } from "@/state/web3";
import { setDaiAllowance } from "@/web3";
import {
  Alert,
  AlertDescription,
  AlertIcon,
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
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
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
import { faWallet } from "@fortawesome/free-solid-svg-icons";
import { FixedNumber, formatEther } from "ethers";
import { ChangeEventHandler, useEffect, useState } from "react";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";

const Allowance = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const account = useSelector(state => state.web3.account);
  const accountShort = useSelector(state => state.web3.accountShort);
  const daiAllowance = useSelector(state => state.web3.daiAllowance);
  const isConnected = useSelector(state => state.web3.isConnected);
  const isFetchingAllowance = useSelector(state => state.web3.isFetchingAllowance);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [allowance, setAllowance] = useState("0");
  const [getPurchases, { data: purchases = [] }] = useLazyGetPurchasesQuery();
  const [getApprovals, { data: approvals = [] }] = useLazyGetApprovalsQuery();

  useEffect(() => {
    if (account) {
      dispatch(fetchDaiAllowance(account));
      getApprovals(account);
      getPurchases(account);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account]);

  useEffect(() => {
    if (daiAllowance != null) {
      setAllowance(Number(formatEther(daiAllowance)).toFixed(2));
    }
  }, [daiAllowance]);

  const handleChange: ChangeEventHandler<HTMLInputElement> = e => {
    const { value } = e.currentTarget;
    setError("");
    setAllowance(value);
  };

  const validate = (value: string) => {
    try {
      FixedNumber.fromString(value.toString(), "fixed128x18");
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
      getApprovals(account);

      dispatch(
        toastSuccess({
          message: `New DAI spending limit set to ◈ ${allowance.toString()}. Happy shopping!`,
          title: "Success"
        })
      );

      setShowModal(false);
      const { pathname } = location.state || {};
      if (pathname) return navigate(pathname);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setAllowance(formatEther(daiAllowance));
  };

  const handleAddAmount = (amount: number) => () => {
    setAllowance(prev => (Number(prev) + amount).toString());
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
            ◈ {Number(formatEther(daiAllowance)).toFixed(2)}
          </StatNumber>
          <StatHelpText textAlign="center">Will decrease with each Gridfire purchase</StatHelpText>
        </Stat>
        <Button
          colorScheme={useColorModeValue("yellow", "purple")}
          isDisabled={!isConnected || isFetchingAllowance}
          leftIcon={<Icon icon={faWallet} />}
          onClick={() => setShowModal(true)}
        >
          {!isConnected ? "Connect wallet" : isFetchingAllowance ? "Fetching allowance…" : "Set new allowance"}
        </Button>
      </Flex>
      <Text mb={8}>
        Each account you connect with Gridfire has a DAI spending allowance, as a security measure to limit the amount a
        contract can spend on your behalf. Once this allowance reaches zero, another limit must be approved before
        further paymenta can be made. As this request costs gas, we advise setting a reasonable budget to avoid
        inconvenience.
      </Text>
      <Divider mb={12} />
      <Heading fontWeight={300} mb={8} textAlign="center">
        DAI Approval History
      </Heading>
      <TableContainer mb={12}>
        <Table variant="simple">
          <TableCaption placement="top">Gridfire DAI approvals for the connected account</TableCaption>
          <Thead>
            <Tr>
              <Th>Block</Th>
              <Th isNumeric>Amount</Th>
            </Tr>
          </Thead>
          <Tbody>
            {approvals.map(({ amount, blockNumber, transactionHash }) => (
              <Tr key={transactionHash}>
                <Td>
                  <Link href={`https://arbiscan.io/tx/${transactionHash}`}>{blockNumber}</Link>
                </Td>
                <Td isNumeric>◈ {Number(formatEther(amount)).toFixed(2)}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
      <Heading fontWeight={300} mb={8} textAlign="center">
        Purchase History
      </Heading>
      <TableContainer>
        <Table variant="simple">
          <TableCaption placement="top">Gridfire purchases made by the connected account</TableCaption>
          <Thead>
            <Tr>
              <Th>Block</Th>
              <Th>Artist</Th>
              <Th>Release</Th>
              <Th isNumeric>Amount</Th>
            </Tr>
          </Thead>
          <Tbody>
            {purchases.map(({ paid, artistId, artistName, blockNumber, releaseId, releaseTitle, transactionHash }) => {
              return (
                <Tr key={transactionHash}>
                  <Td>
                    <Link href={`https://arbiscan.io/tx/${transactionHash}`}>{blockNumber}</Link>
                  </Td>
                  <Td>
                    <Link as={RouterLink} to={`/artist/${artistId}`}>
                      {artistName}
                    </Link>
                  </Td>
                  <Td>
                    <Link as={RouterLink} to={`/release/${releaseId}`}>
                      {releaseTitle}
                    </Link>
                  </Td>
                  <Td isNumeric>◈ {Number(formatEther(paid)).toFixed(2)}</Td>
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
                isDisabled={isSubmitting}
                isInvalid={Boolean(error)}
                min={0}
                name="allowance"
                onChange={handleChange}
                textAlign="center"
                title=""
                type="number"
                value={allowance}
                variant="modal"
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
            <Divider borderColor={useColorModeValue("gray.200", "gray.500")} mt={8} />
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
