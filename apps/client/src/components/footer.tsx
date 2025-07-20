import {
  Center,
  Container,
  Divider,
  HStack,
  Link,
  List,
  ListItem,
  Text,
  useColorModeValue,
  Wrap,
  WrapItem
} from "@chakra-ui/react";
import { faCircle } from "@fortawesome/free-solid-svg-icons";
import { DateTime } from "luxon";
import React from "react";
import { Link as RouterLink } from "react-router-dom";

import { useSelector } from "@/hooks";

import Icon from "./icon";

const editionsContractAddress = import.meta.env.VITE_GRIDFIRE_EDITIONS_ADDRESS;
const paymentContractAddress = import.meta.env.VITE_GRIDFIRE_PAYMENT_ADDRESS;

const Footer: React.FC = () => {
  const account = useSelector(state => state.user.account);
  const gridbotTextColour = useColorModeValue("gray.600", "gray.400");
  const lastCheckedBlockDate = useSelector(state => state.web3.lastCheckedBlockDate);
  const lastCheckedBlockNumber = useSelector(state => state.web3.lastCheckedBlockNumber);
  const today = new Date();
  const year = today.getFullYear();

  return (
    <Container as="footer" maxW="container.xl" mt={16} pt={8}>
      <HStack alignItems="flex-start">
        <Center flex={1}>
          <List>
            <ListItem>
              <Link as={RouterLink} to={"/about"}>
                About
              </Link>
            </ListItem>
            <ListItem>
              <Link href={`https://arbiscan.io/address/${paymentContractAddress}`} isExternal>
                Payment contract
              </Link>
            </ListItem>
            <ListItem>
              <Link href={`https://arbiscan.io/address/${editionsContractAddress}`} isExternal>
                Editions contract
              </Link>
            </ListItem>
          </List>
        </Center>
        {account ? (
          <Center flex={1}>
            <List>
              <ListItem>
                <Link as={RouterLink} to={"/dashboard"}>
                  Dashboard
                </Link>
              </ListItem>
              <ListItem>
                <Link as={RouterLink} to={"/dashboard/collection"}>
                  Collection
                </Link>
              </ListItem>
              <ListItem>
                <Link as={RouterLink} to={"/dashboard/payment"}>
                  Payment
                </Link>
              </ListItem>
            </List>
          </Center>
        ) : null}
      </HStack>
      <Divider borderColor={useColorModeValue("gray.300", "gray.600")} my={8} />
      <Center mb={16}>
        {lastCheckedBlockNumber ? (
          <Text color={gridbotTextColour} textAlign={"center"}>
            <Icon color="green.400" fontSize="small" icon={faCircle} mr={2} />
            Gridbot online
            <br />
            Latest block:{" "}
            <Link href={`https://arbiscan.io/block/${lastCheckedBlockNumber}`} isExternal>
              {lastCheckedBlockNumber}
            </Link>{" "}
            at {DateTime.fromMillis(lastCheckedBlockDate).toLocaleString(DateTime.TIME_WITH_SECONDS)}
          </Text>
        ) : (
          <Text color={gridbotTextColour}>
            <Icon color="orange.300" fontSize="small" icon={faCircle} mr={2} />
            Waiting for Gridbot
          </Text>
        )}
      </Center>
      <Center mb={16}>
        <Wrap spacing={3}>
          <WrapItem>
            <Text fontSize="small">
              &copy; {year}{" "}
              <Link href="https://ochremusic.com" isExternal>
                Chris Leary
              </Link>
            </Text>
          </WrapItem>
          <WrapItem>
            <Link fontSize="small" href="https://bsky.app/profile/ochremusic.com" isExternal>
              Bluesky
            </Link>
          </WrapItem>
        </Wrap>
      </Center>
    </Container>
  );
};

export default Footer;
