import { Activity, ActivityFavourite, ActivityFollow, ActivitySale, ActivitySaleEdition, ActivityType } from "types";
import { Box, ListItem, useColorModeValue } from "@chakra-ui/react";
import { faCircleCheck, faHeart, faMoneyBillWave } from "@fortawesome/free-solid-svg-icons";
import { DateTime } from "luxon";
import Icon from "components/icon";
import { formatEther } from "ethers";
import { useSelector } from "hooks";

interface Props {
  activity: Activity;
}

const ItemDate = ({ createdAt }: { createdAt: string }) => {
  const date = DateTime.fromISO(createdAt).toLocaleString(DateTime.DATETIME_SHORT);

  return (
    <Box as="span" color={useColorModeValue("gray.600", "gray.400")} mr={2}>
      {date}
    </Box>
  );
};

const ActivityItem = ({ activity }: Props) => {
  const green = useColorModeValue("green.300", "green.100");
  const lastCheckedOn = useSelector(state => state.artists.lastCheckedOn);
  const { createdAt, type } = activity;
  const isUnread = DateTime.fromISO(createdAt) > DateTime.fromISO(lastCheckedOn as string);
  const unreadColor = useColorModeValue("orange.500", "yellow.300");

  switch (type) {
    case ActivityType.Favourite: {
      const { account, releaseTitle, username }: ActivityFavourite = activity;

      return (
        <ListItem color={isUnread ? unreadColor : undefined}>
          <Icon color="red.400" icon={faHeart} mr={2} />
          <ItemDate createdAt={createdAt} />
          User{" "}
          <Box as="span" fontWeight="semibold">
            {username || `${account.slice(0, 6)}…${account.slice(-4)}`}
          </Box>{" "}
          liked your release{" "}
          <Box as="span" fontStyle="italic">
            {releaseTitle}
          </Box>
          .
        </ListItem>
      );
    }
    case ActivityType.Follow: {
      const { account, artistName, username }: ActivityFollow = activity;

      return (
        <ListItem color={isUnread ? unreadColor : undefined}>
          <Icon color="purple.200" icon={faCircleCheck} mr={2} />
          <ItemDate createdAt={createdAt} />
          User{" "}
          <Box as="span" fontWeight="semibold">
            {username || `${account.slice(0, 6)}…${account.slice(-4)}`}
          </Box>{" "}
          started following{" "}
          <Box as="span" fontStyle="italic">
            {artistName}
          </Box>
          .
        </ListItem>
      );
    }
    case ActivityType.Sale: {
      const { account, amountPaid = "0", releaseTitle, username }: ActivitySaleEdition | ActivitySale = activity;

      return (
        <ListItem color={isUnread ? unreadColor : undefined}>
          <Icon color={green} icon={faMoneyBillWave} mr={2} />
          <ItemDate createdAt={createdAt} />
          User{" "}
          <Box as="span" fontWeight="semibold">
            {username || `${account.slice(0, 6)}…${account.slice(-4)}`}
          </Box>{" "}
          bought {"editionDescription" in activity && activity.editionDescription ? "an edition of " : null}
          <Box as="span" fontStyle="italic">
            {releaseTitle}
          </Box>{" "}
          for {Number(formatEther(amountPaid)).toFixed(2)} Dai!
        </ListItem>
      );
    }
    default:
      return null;
  }
};

export default ActivityItem;
