import {
  Center,
  Container,
  Divider,
  HStack,
  Link,
  List,
  ListItem,
  Text,
  Wrap,
  WrapItem,
  useColorModeValue
} from "@chakra-ui/react";
import { shallowEqual, useSelector } from "react-redux";
import { Link as RouterLink } from "react-router-dom";
import Icon from "./icon";
import React from "react";
import { RootState } from "index";
import { faGithub, faTwitter } from "@fortawesome/free-brands-svg-icons";

const { REACT_APP_CONTRACT_ADDRESS } = process.env;

const Footer: React.FC = () => {
  const { account } = useSelector((state: RootState) => state.user, shallowEqual);
  const today = new Date();
  const year = today.getFullYear();

  return (
    <Container as="footer" maxW="container.xl" p={0} pt={8}>
      <HStack alignItems="flex-start">
        <Center flex={1}>
          <List>
            <ListItem>
              <Link as={RouterLink} to={"/about"}>
                About
              </Link>
            </ListItem>
            <ListItem>
              <Link href={`https://arbiscan.io/address/${REACT_APP_CONTRACT_ADDRESS}`} isExternal>
                Contract
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
      <Center>
        <Wrap spacing={3}>
          <WrapItem>
            <Text fontSize="small">
              &copy; 2017&ndash;{year}{" "}
              <Link href="https://ochremusic.com" isExternal>
                Christopher Leary
              </Link>
            </Text>
          </WrapItem>
          <WrapItem>
            <Link href="https://twitter.com/ochremusic" isExternal>
              <Icon icon={faTwitter} />
            </Link>
          </WrapItem>
          <WrapItem>
            <Link href="https://github.com/csleary/gridfire" isExternal>
              <Icon icon={faGithub} />
            </Link>
          </WrapItem>
        </Wrap>
      </Center>
    </Container>
  );
};

export default Footer;
