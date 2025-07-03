import Icon from "@/components/icon";
import { useDispatch, useSelector } from "@/hooks";
import { useLazyGetClaimsQuery } from "@/state/logs";
import { toastError, toastInfo, toastSuccess, toastWarning } from "@/state/toast";
import { fetchDaiBalance } from "@/state/web3";
import { claimBalance, getBalance } from "@/web3";
import {
  Button,
  Divider,
  Flex,
  Heading,
  Link,
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
import { faWallet } from "@fortawesome/free-solid-svg-icons";
import { formatEther } from "ethers";
import { useEffect, useState } from "react";

const Balance = () => {
  const dispatch = useDispatch();
  const account = useSelector(state => state.web3.account);
  const isConnected = useSelector(state => state.web3.isConnected);
  const paymentAddress = useSelector(state => state.user.paymentAddress);
  const [getClaims, { data: claims = [] }] = useLazyGetClaimsQuery();
  const [balance, setBalance] = useState("0");
  const [isClaiming, setIsClaiming] = useState(false);

  useEffect(() => {
    if (paymentAddress) {
      getClaims();
    }
  }, [balance, getClaims, paymentAddress]);

  useEffect(() => {
    if (!isConnected) return;
    getBalance(paymentAddress).then(setBalance).catch(console.error);
  }, [isConnected, paymentAddress]);

  const handleClaimBalance = async () => {
    try {
      setIsClaiming(true);
      await claimBalance();
      setBalance("0");
      dispatch(fetchDaiBalance(account));
      dispatch(
        toastSuccess({ message: "Your DAI balance has been transferred to your wallet address.", title: "Claimed!" })
      );
    } catch (error: any) {
      if (balance === "0") {
        return void dispatch(
          toastInfo({ message: "There's nothing to claim at the moment.", title: "Nothing to claim" })
        );
      }

      if (error.info?.error.code === 4001) {
        return void dispatch(toastWarning({ message: "Claim rejected.", title: "Rejected" }));
      }

      dispatch(toastError({ message: error.info?.error.message || error.message, title: "Error" }));
      console.error(error);
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <>
      <Heading fontWeight={300} mb={8} textAlign="center">
        Your Gridfire Balance
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
          <StatHelpText textAlign="center">The claimable amount in your Gridfire account</StatHelpText>
        </Stat>
        <Button
          colorScheme={useColorModeValue("yellow", "purple")}
          leftIcon={<Icon icon={faWallet} />}
          isDisabled={!isConnected || balance === "0" || account.toLowerCase() !== paymentAddress.toLowerCase()}
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
        Your live Gridfire account balance, accruing with every music sale. You can withdraw this at any time using the
        account matching the sales payment address.
      </Text>
      <Divider mb={12} />
      <Heading fontWeight={300} mb={8} textAlign="center">
        Claim History
      </Heading>
      <TableContainer>
        <Table variant="simple">
          <TableCaption placement="top">DAI withdrawals from your Gridfire account</TableCaption>
          <Thead>
            <Tr>
              <Th>Block</Th>
              <Th isNumeric>Amount</Th>
            </Tr>
          </Thead>
          <Tbody>
            {claims.map(({ blockNumber, logIndex, transactionHash, value }) => (
              <Tr key={`${transactionHash}-${logIndex}`}>
                <Td>
                  <Link href={`https://arbiscan.io/tx/${transactionHash}`}>{blockNumber}</Link>
                </Td>
                <Td isNumeric>◈ {Number(formatEther(value)).toFixed(2)}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
    </>
  );
};

export default Balance;
