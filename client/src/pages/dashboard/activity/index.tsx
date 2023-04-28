import { Container, Heading, Text } from "@chakra-ui/react";
import { Helmet } from "react-helmet";
import { useDispatch, useSelector } from "hooks";
import { fetchActivity } from "state/user";
import { shallowEqual } from "react-redux";
import { useEffect } from "react";
import Icon from "components/icon";
import { faCircleCheck, faHeart, faMoneyBillWave } from "@fortawesome/free-solid-svg-icons";
import { formatEther } from "ethers";

interface ActivityProperties {
  _id: string;
  artistName: string;
  createdAt: Date;
  editionDescription: string;
  type: string;
  releaseTitle?: string;
  amountPaid: number;
  account: string;
  username: string;
}

const Activity = () => {
  const dispatch = useDispatch();
  const { activity } = useSelector(state => state.user, shallowEqual);

  useEffect(() => {
    dispatch(fetchActivity());
  }, [dispatch]);

  return (
    <>
      <Helmet>
        <title>Activity</title>
      </Helmet>
      <Container as="main" p={0} maxWidth="container.xl">
        <Heading as="h2">Activity</Heading>
        {activity.map(
          ({
            _id: itemId,
            account,
            amountPaid,
            artistName,
            createdAt,
            editionDescription,
            releaseTitle,
            type,
            username
          }: ActivityProperties) => {
            const date = `${new Date(createdAt).toLocaleDateString()}, ${new Date(createdAt).toLocaleTimeString()}`;

            switch (type) {
              case "favourite":
                return (
                  <Text key={itemId} mb={2}>
                    <Text as="span" color="gray.400" mr={4}>
                      {date}
                    </Text>
                    <Icon color="red.400" icon={faHeart} mr={4} />
                    User{" "}
                    <Text as="span" fontWeight="semibold">
                      {username || `${account.slice(0, 6)}…${account.slice(-4)}`}
                    </Text>{" "}
                    liked your release{" "}
                    <Text as="span" fontStyle="italic">
                      {releaseTitle}
                    </Text>
                    .
                  </Text>
                );
              case "follow":
                return (
                  <Text key={itemId} mb={2}>
                    <Text as="span" color="gray.400" mr={4}>
                      {date}
                    </Text>
                    <Icon color="purple.200" icon={faCircleCheck} mr={4} />
                    User{" "}
                    <Text as="span" fontWeight="semibold">
                      {username || `${account.slice(0, 6)}…${account.slice(-4)}`}
                    </Text>{" "}
                    started following{" "}
                    <Text as="span" fontStyle="italic">
                      {artistName}
                    </Text>
                    .
                  </Text>
                );
              case "sale":
                return (
                  <Text key={itemId} mb={2}>
                    <Text as="span" color="gray.400" mr={4}>
                      {date}
                    </Text>
                    <Icon color="green.100" icon={faMoneyBillWave} mr={4} />
                    User{" "}
                    <Text as="span" fontWeight="semibold">
                      {username || `${account.slice(0, 6)}…${account.slice(-4)}`}
                    </Text>{" "}
                    bought {editionDescription ? "an edition of" : "your release"}{" "}
                    <Text as="span" fontStyle="italic">
                      {releaseTitle}
                    </Text>{" "}
                    for {Number(formatEther(amountPaid)).toFixed(2)} Dai!
                  </Text>
                );
              default:
                return null;
            }
          }
        )}
      </Container>
    </>
  );
};

export default Activity;
