import { ActivityFavourite, ActivityFollow, ActivitySale, ActivitySaleEdition, ActivityType } from "types";
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

const Activity = () => {
  const dispatch = useDispatch();
  const activityList = useSelector(state => state.artists.activity, shallowEqual);

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
        {activityList.map(activity => {
          const { createdAt, type } = activity;
          const date = DateTime.fromISO(createdAt).toLocaleString(DateTime.DATETIME_SHORT);

          switch (type) {
            case ActivityType.Favourite: {
              const { _id: activityId, account, releaseTitle, username }: ActivityFavourite = activity;

              return (
                <Text key={activityId} mb={2}>
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
            case ActivityType.Follow: {
              const { _id: activityId, account, artistName, username }: ActivityFollow = activity;

              return (
                <Text key={activityId} mb={2}>
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
            case ActivityType.Sale: {
              const {
                _id: activityId,
                account,
                amountPaid = "0",
                editionDescription,
                releaseTitle,
                username
              }: ActivitySale & ActivitySaleEdition = activity;

              return (
                <Text key={activityId} mb={2}>
                  <Text as="span" color="gray.400" mr={4}>
                    {date}
                  </Text>
                  <Icon color="green.100" icon={faMoneyBillWave} mr={4} />
                  User{" "}
                  <Text as="span" fontWeight="semibold">
                    {username || `${account.slice(0, 6)}…${account.slice(-4)}`}
                  </Text>{" "}
                  bought {editionDescription ? "an edition of " : null}
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
        })}
      </Container>
    </>
  );
};

export default Activity;
