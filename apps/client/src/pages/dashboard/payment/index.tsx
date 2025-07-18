import { Container, Tab, TabList, TabPanel, TabPanels, Tabs, useColorModeValue } from "@chakra-ui/react";
import { faEthereum } from "@fortawesome/free-brands-svg-icons";
import { faCheckCircle, faCoins } from "@fortawesome/free-solid-svg-icons";
import { lazy, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import Icon from "@/components/icon";
const Balance = lazy(() => import("./balance"));
const PaymentAddress = lazy(() => import("./paymentAddress"));
const Allowance = lazy(() => import("./allowance"));

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
        colorScheme={useColorModeValue("yellow", "purple")}
        index={activeTab}
        isFitted
        onChange={setActiveTab}
        variant="solid-rounded"
      >
        <TabList flexDirection={["column", "row"]} mb={16}>
          <Tab alignItems="center" as={Link} to={`${stem}/balance`}>
            <Icon icon={faCoins} mr={2} />
            Balance
          </Tab>
          <Tab alignItems="center" as={Link} to={`${stem}/address`}>
            <Icon icon={faEthereum} mr={2} />
            Address
          </Tab>
          <Tab alignItems="center" as={Link} to={`${stem}/approvals`}>
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
