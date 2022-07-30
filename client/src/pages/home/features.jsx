import { Box, Wrap, useColorModeValue } from "@chakra-ui/react";
import Feature from "./feature";

const Features = () => {
  return (
    <Box as="section" bg={useColorModeValue("whiteAlpha.800", "blackAlpha.500")} mx={-8} mb={24} py={12}>
      <Wrap spacing={12} justify="center">
        <Feature title="Low platform fees">
          Artists receive 95% of the price they set.{" "}
          <Box as="span" color="gray.400">
            We take just 5% of sales to support development. The rest is yours.
          </Box>
        </Feature>
        <Feature title="Smarter payments">
          Payments are immediately transferred to secure artist smart contract accounts.{" "}
          <Box as="span" color="gray.400">
            Withdraw at any time to an account you control.
          </Box>
        </Feature>
        <Feature title="A global currency">
          Payments are made using the DAI stablecoin &ndash; the original USD-pegged digital currency.{" "}
          <Box as="span" color="gray.400">
            Your audience is global. Payments can be too.
          </Box>
        </Feature>
        <Feature title="Secure audio">
          Optimised and encrypted audio is stored on the IPFS network.{" "}
          <Box as="span" color="gray.400">
            Add extra pinning locations or host your own files.
          </Box>
        </Feature>
        <Feature title="Low network fees">
          Arbitrum, an Ethereum layer-two roll-up, is our payment network.{" "}
          <Box as="span" color="gray.400">
            For fast transactions and low fees compared to the mainnet.
          </Box>
        </Feature>
      </Wrap>
    </Box>
  );
};

export default Features;
