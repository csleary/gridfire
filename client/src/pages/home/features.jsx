import { Box, Wrap, useColorModeValue } from "@chakra-ui/react";
import Feature from "./feature";

const Features = () => {
  return (
    <Box as="section" bg={useColorModeValue("whiteAlpha.800", "blackAlpha.500")} mx={-8} mb={24} py={12}>
      <Wrap spacing={12} justify="center">
        <Feature title="Low platform fees">
          Artists receive 95% of the price they set. We take just 5% of sales to support development.
        </Feature>
        <Feature title="Smarter payments">
          Sales proceeds are immediately transferred to secure artist smart contract accounts, to be withdrawn at any
          time.
        </Feature>
        <Feature title="A global currency">
          Payments are made using the DAI stablecoin &ndash; the original USD-pegged digital currency.
        </Feature>
        <Feature title="Secure audio">
          Optimised and encrypted audio is stored on the IPFS network. Add pinning locations or host your own files.
        </Feature>
        <Feature title="Low network fees">
          We use Arbitrum as our payment network, ensuring fast transactions and low fees in comparison to the Ethereum
          mainnet.
        </Feature>
      </Wrap>
    </Box>
  );
};

export default Features;
