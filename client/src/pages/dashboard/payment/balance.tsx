import {
  Button,
  Divider,
  Flex,
  Heading,
  Link,
  Stat,
  StatLabel,
  StatHelpText,
  StatNumber,
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
import { claimBalance, getBalance, getGridFireClaimEvents } from "web3/contract";
import { toastError, toastInfo, toastSuccess } from "state/toast";
import { useDispatch, useSelector } from "hooks";
import { useEffect, useState } from "react";
import { faWallet } from "@fortawesome/free-solid-svg-icons";
import { fetchDaiBalance } from "state/web3";
import { formatEther } from "ethers";
import { shallowEqual } from "react-redux";
import Icon from "components/icon";

const Balance = () => {
  const dispatch = useDispatch();
  const { user, web3 } = useSelector(state => state, shallowEqual);
  const { paymentAddress } = user;
  const { account, isConnected } = web3;
  const [balance, setBalance] = useState(0n);
  const [isClaiming, setIsClaiming] = useState(false);
  const [claims, setClaims] = useState([]);

  // Fetch payments received.
  useEffect(() => {
    if (paymentAddress) {
      getGridFireClaimEvents().then(setClaims);
    }
  }, [balance, paymentAddress]);

  useEffect(() => {
    if (!isConnected) return;
    getBalance(paymentAddress).then(setBalance).catch(console.error);
  }, [isConnected, paymentAddress]);

  const handleClaimBalance = async () => {
    try {
      setIsClaiming(true);
      await claimBalance();
      setBalance(0n);
      dispatch(fetchDaiBalance(account));
      dispatch(toastSuccess({ message: "DAI balance claimed successfully", title: "Success!" }));
    } catch (error: any) {
      if (balance === 0n) {
        return void dispatch(
          toastInfo({ message: "There's nothing to claim at the moment.", title: "Nothing to claim." })
        );
      }

      dispatch(toastError({ message: error.message, title: "Error" }));
      console.error(error);
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <>
      <Heading fontWeight={300} mb={8} textAlign="center">
        Your GridFire Balance
      </Heading>
      <Flex
        bg={useColorModeValue("white", "gray.800")}
        borderWidth="1px"
        borderColor={useColorModeValue("gray.200", "gray.700")}
        boxShadow="md"
        flexDirection="column"
        rounded="lg"
        mb={12}
        p={4}
      >
        <Stat mb={4}>
          <StatLabel textAlign="center">Current DAI balance</StatLabel>
          <StatNumber fontSize="4xl" textAlign="center">
            ◈ {Number(formatEther(balance)).toFixed(2)}
          </StatNumber>
          <StatHelpText textAlign="center">The claimable amount in your GridFire account</StatHelpText>
        </Stat>
        <Button
          colorScheme={useColorModeValue("yellow", "purple")}
          leftIcon={<Icon icon={faWallet} />}
          isDisabled={!isConnected || balance === 0n || account.toLowerCase() !== paymentAddress.toLowerCase()}
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
      <Text mb={12}>
        Your live GridFire account balance, accruing with every music sale. You may withdraw this at any time using the
        account matching the sales payment address.
      </Text>
      <Divider mb={12} />
      <Heading fontWeight={300} mb={8} textAlign="center">
        Claim History
      </Heading>
      <TableContainer>
        <Table variant="simple">
          <TableCaption placement="top">DAI withdrawals from your GridFire account</TableCaption>
          <Thead>
            <Tr>
              <Th>Block</Th>
              <Th isNumeric>Amount</Th>
            </Tr>
          </Thead>
          <Tbody>
            {claims.map(({ amount, blockNumber, transactionHash }) => (
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
    </>
  );
};

export default Balance;
