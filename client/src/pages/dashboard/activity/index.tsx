import { Container, Heading, Text } from "@chakra-ui/react";
import { faCircleCheck, faHeart, faMoneyBillWave } from "@fortawesome/free-solid-svg-icons";
import { useDispatch, useSelector } from "hooks";
import { DateTime } from "luxon";
import { Helmet } from "react-helmet";
import Icon from "components/icon";
import { fetchActivity } from "state/artists";
import { formatEther } from "ethers";
import { shallowEqual } from "react-redux";
import { useEffect } from "react";
import { Activity as IActivity } from "types";

const Activity = () => {
  const dispatch = useDispatch();
  const activity = useSelector(state => state.artists.activity, shallowEqual);

  useEffect(() => {
    dispatch(fetchActivity());
  }, [dispatch]);

  return (
    <>
      <Helmet>
        <title>Activity Log</title>
      </Helmet>
      <Container as="main" p={0} maxWidth="container.xl">
        <Heading as="h2">Activity Log</Heading>
        {activity.map(
          ({
            _id: itemId,
            account,
            amountPaid = "0",
            artistName,
            createdAt,
            editionDescription,
            releaseTitle,
            type,
            username
          }: IActivity) => {
            const date = DateTime.fromISO(createdAt).toLocaleString(DateTime.DATETIME_SHORT);

            switch (type) {
              case "favourite": {
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
              }
              case "follow": {
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
              }
              case "sale": {
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
              }
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
