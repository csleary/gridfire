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
        GridFire is a music download store, using the Arbitrum blockchain for payments and NFT-backed releases.
      </Text>
      <Text fontSize="xl" mb={6}>
        Artists set a price for their releases in DAI (arguably the most trusted and decentralised USD stablecoin),
        accruing sales payments in a smart contract, to be withdrawn at any time. We charge a small fee of 5% of sales
        made by the artist.
      </Text>
      <Text fontSize="xl" mb={6}>
        Fans can pay using popular in-browser web3 wallets such as Metamask, and can purchase NFTs representing
        particular releases, to be stored in their wallet.
      </Text>
    </Container>
  </>
);

export default About;
