import { shallowEqual, useSelector } from "react-redux";
import { Link as RouterLink } from "react-router-dom";
import { Center, Container, Divider, HStack, Link, List, ListItem, Text } from "@chakra-ui/react";
import React from "react";
import { RootState } from "index";

const Footer: React.FC = () => {
  const user = useSelector((state: RootState) => state.user, shallowEqual);
  const { auth } = user;
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
          </List>
        </Center>
        {auth ? (
          <Center flex={1}>
            <List>
              <ListItem>
                <Link as={RouterLink} to={"/release/add/"}>
                  Add Release
                </Link>
              </ListItem>
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
                <Link as={RouterLink} to={"/dashboard/address"}>
                  Payment
                </Link>
              </ListItem>
            </List>
          </Center>
        ) : null}
      </HStack>
      <Divider borderColor="gray.300" my={8} />
      <Center fontSize="small">
        <Text>
          &copy; 2017&ndash;{year}{" "}
          <Link to="https://ochremusic.com" isExternal>
            Christopher Leary
          </Link>
        </Text>
      </Center>
    </Container>
  );
};

export default Footer;
