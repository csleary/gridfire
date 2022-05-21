import { Container, Tabs, TabList, TabPanel, TabPanels, Tab, useColorModeValue } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Allowance from "./allowance";
import Balance from "./balance";
import PaymentAddress from "./paymentAddress";
const stem = "/dashboard/payment";

const Payment = () => {
  const { pathname } = useLocation();
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const paths = [stem, `${stem}/address`, `${stem}/approvals`];
    const index = paths.indexOf(pathname);
    setActiveTab(index === -1 ? 0 : index);
  }, [pathname]);

  return (
    <Container as="main" maxW="container.sm" p={0}>
      <Tabs index={activeTab} onChange={setActiveTab} colorScheme={useColorModeValue("yellow", "purple")} isFitted>
        <TabList mb={16}>
          <Tab as={Link} to={`${stem}/balance`}>
            Account Balance
          </Tab>
          <Tab as={Link} to={`${stem}/address`}>
            Payment Address
          </Tab>
          <Tab as={Link} to={`${stem}/approvals`}>
            DAI Approvals
          </Tab>
        </TabList>
        <TabPanels>
          <TabPanel p={0}>
            <Balance />
          </TabPanel>
          <TabPanel p={0}>
            <PaymentAddress />
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
