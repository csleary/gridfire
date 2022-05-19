import { Container, Tabs, TabList, TabPanel, TabPanels, Tab, useColorModeValue } from "@chakra-ui/react";
import Allowance from "./allowance";
import Balance from "./balance";
import PaymentAddress from "./paymentAddress";

const Payment = () => {
  return (
    <Container as="main" maxW="container.sm" p={0}>
      <Tabs colorScheme={useColorModeValue("yellow", "purple")} isFitted>
        <TabList mb={16}>
          <Tab>Payment Address</Tab>
          <Tab>GridFire Balance</Tab>
          <Tab>DAI Spending</Tab>
        </TabList>
        <TabPanels>
          <TabPanel p={0}>
            <PaymentAddress />
          </TabPanel>
          <TabPanel p={0}>
            <Balance />
          </TabPanel>
          <TabPanel p={0}>
            <Allowance />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Container>
  );
};

export default Payment;
