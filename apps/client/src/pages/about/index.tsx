import { Container, Heading, Text } from "@chakra-ui/react";
import { Helmet } from "react-helmet";

const About = () => (
  <>
    <Helmet>
      <title>About Gridfire</title>
      <meta name="description" content="Learn about the Gridfire music streaming and download platform." />
    </Helmet>
    <Container as="main" p={0}>
      <Heading as="h2">About Gridfire</Heading>
      <Text fontSize="xl" mb={6}>
        Gridfire is a music streaming and download store, using the Arbitrum blockchain for payments and NFT Editions.
      </Text>
      <Text fontSize="xl" mb={6}>
        Artists set a price for their releases in DAI (arguably the most trusted and decentralised USD stablecoin),
        accruing sales payments in a smart contract, to be withdrawn at any time. We charge a small fee of 5% of sales
        made by the artist.
      </Text>
      <Text fontSize="xl" mb={6}>
        Fans can pay using popular in-browser web3 wallets such as Metamask, and can also purchase NFTs representing
        particular releases, kept in their wallet.
      </Text>
    </Container>
  </>
);

export default About;
