import { Container, Heading, Text } from "@chakra-ui/react";
import { Helmet } from "react-helmet";

const About = () => (
  <>
    <Helmet>
      <title>About GridFire</title>
      <meta name="description" content="Learn about the GridFire music streaming and download platform." />
    </Helmet>
    <Container as="main" p={0}>
      <Heading as="h2">About GridFire</Heading>
      <Text fontSize="xl" mb={6}>
        GridFire is a music download store that uses the Arbitrum blockchain and Ether cryptocurrency (ETH) for payment,
        allowing artists to receive payments directly from fans, without an intermediary payment processor.
      </Text>
      <Text fontSize="xl">
        Artists set a price for their releases in DAI (a stablecoin set to track USD), and can withdraw their payments
        from a smart contract at their convenience. Fans can make purchases using popular in-browser wallets such as
        Metamask.
      </Text>
    </Container>
  </>
);

export default About;
