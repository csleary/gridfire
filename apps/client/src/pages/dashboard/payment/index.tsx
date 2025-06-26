import Icon from "@/components/icon";
import { Container, Tab, TabList, TabPanel, TabPanels, Tabs, useColorModeValue } from "@chakra-ui/react";
import { faEthereum } from "@fortawesome/free-brands-svg-icons";
import { faCheckCircle, faCoins } from "@fortawesome/free-solid-svg-icons";
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
      <Tabs
        index={activeTab}
        onChange={setActiveTab}
        colorScheme={useColorModeValue("yellow", "purple")}
        isFitted
        variant="solid-rounded"
      >
        <TabList mb={16} flexDirection={["column", "row"]}>
          <Tab as={Link} to={`${stem}/balance`} alignItems="center">
            <Icon icon={faCoins} mr={2} />
            Balance
          </Tab>
          <Tab as={Link} to={`${stem}/address`} alignItems="center">
            <Icon icon={faEthereum} mr={2} />
            Address
          </Tab>
          <Tab as={Link} to={`${stem}/approvals`} alignItems="center">
            <Icon icon={faCheckCircle} mr={2} />
            DAI
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
