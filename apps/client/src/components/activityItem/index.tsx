import { Box, ChakraProps, Flex, ListItem, useColorModeValue } from "@chakra-ui/react";
import { faAsterisk, faHeart, faMoneyBillWave, faUserPlus } from "@fortawesome/free-solid-svg-icons";
import {
  Activity,
  ActivityFavourite,
  ActivityFollow,
  ActivitySale,
  ActivitySaleEdition,
  ActivityType
} from "@gridfire/shared/types";
import { formatEther } from "ethers";
import { DateTime } from "luxon";

import Icon from "@/components/icon";
import { useSelector } from "@/hooks";

interface Props extends ChakraProps {
  activity: Activity;
}

const ItemDate = ({ createdAt, isUnread }: { createdAt: string; isUnread: boolean }) => {
  const date = DateTime.fromISO(createdAt).toRelative();
  const color = useColorModeValue("gray.600", "gray.400");
  const unreadColor = useColorModeValue("orange.500", "yellow.400");

  return (
    <Box alignItems="center" display="inline-flex">
      <Box as="span" color={isUnread ? unreadColor : color} fontWeight={500} mr={2}>
        {date}
      </Box>
      {isUnread ? <Icon color={unreadColor} icon={faAsterisk} /> : null}
    </Box>
  );
};

const ActivityItem = ({ activity, ...rest }: Props) => {
  const blue = useColorModeValue("blue.400", "blue.200");
  const green = useColorModeValue("green.400", "green.200");
  const lastCheckedOn = useSelector(state => state.artists.lastCheckedOn);
  const { createdAt, type } = activity;
  const isUnread = DateTime.fromISO(createdAt) > DateTime.fromISO(lastCheckedOn ?? new Date(0).toISOString());

  switch (type) {
    case ActivityType.Favourite: {
      const { account, releaseTitle, username }: ActivityFavourite = activity;

      return (
        <ListItem {...rest}>
          <Flex alignItems="center">
            <Icon color="red.400" icon={faHeart} mr={2} />
            <ItemDate createdAt={createdAt} isUnread={isUnread} />
          </Flex>
          <Box>
            User{" "}
            <Box as="span" fontWeight="semibold">
              {username || `${account.slice(0, 6)}…${account.slice(-4)}`}
            </Box>{" "}
            liked your release{" "}
            <Box as="span" fontStyle="italic">
              {releaseTitle}
            </Box>
            .
          </Box>
        </ListItem>
      );
    }
    case ActivityType.Follow: {
      const { account, artistName, username }: ActivityFollow = activity;

      return (
        <ListItem {...rest}>
          <Flex alignItems="center">
            <Icon color={blue} icon={faUserPlus} mr={2} />
            <ItemDate createdAt={createdAt} isUnread={isUnread} />
          </Flex>
          <Box>
            User{" "}
            <Box as="span" fontWeight="semibold">
              {username || `${account.slice(0, 6)}…${account.slice(-4)}`}
            </Box>{" "}
            started following{" "}
            <Box as="span" fontStyle="italic">
              {artistName}
            </Box>
            .
          </Box>
        </ListItem>
      );
    }
    case ActivityType.Sale: {
      const { account, amountPaid = "0", releaseTitle, username }: ActivitySale | ActivitySaleEdition = activity;

      return (
        <ListItem {...rest}>
          <Flex alignItems="center">
            <Icon color={green} icon={faMoneyBillWave} mr={2} />
            <ItemDate createdAt={createdAt} isUnread={isUnread} />
          </Flex>
          <Box>
            User{" "}
            <Box as="span" fontWeight="semibold">
              {username || `${account.slice(0, 6)}…${account.slice(-4)}`}
            </Box>{" "}
            bought {"editionDescription" in activity && activity.editionDescription ? "an edition of " : null}
            <Box as="span" fontStyle="italic">
              {releaseTitle}
            </Box>{" "}
            for {Number(formatEther(amountPaid)).toFixed(2)} Dai!
          </Box>
        </ListItem>
      );
    }
    default:
      return null;
  }
};

export default ActivityItem;
