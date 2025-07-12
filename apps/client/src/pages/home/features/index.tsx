import { Box, useColorModeValue, Wrap } from "@chakra-ui/react";

import Feature from "./feature";

const Features = () => {
  return (
    <Box
      as="section"
      bg={useColorModeValue("whiteAlpha.800", "blackAlpha.500")}
      mb={24}
      mx={[-3, -4]} // Mirror parent padding.
      py={12}
    >
      <Wrap justify="center" spacing={12}>
        <Feature title="Low fees">
          Our cut is just 5%. The rest is yours.{" "}
          <Box as="span" color="gray.400">
            All on Arbitrum, an Ethereum layer 2 roll-up, for fast transactions and low payment fees.
          </Box>
        </Feature>
        <Feature title="NFT Editions">
          Create NFT Gridfire Editions.{" "}
          <Box as="span" color="gray.400">
            Mint limited digital runs and one-offs for your releases, with exclusive downloads.
          </Box>
        </Feature>
        <Feature title="Smarter payments">
          Payments are immediately transferred to secure artist smart contract accounts.{" "}
          <Box as="span" color="gray.400">
            Withdraw at any time to your wallet.
          </Box>
        </Feature>
        <Feature title="A global currency">
          Payments are made using the DAI stablecoin &ndash; the original USD-pegged digital currency.{" "}
          <Box as="span" color="gray.400">
            Streamlined payments for a global audience.
          </Box>
        </Feature>
      </Wrap>
    </Box>
  );
};

export default Features;
