import {
  Badge,
  Box,
  IconButton,
  Link,
  List,
  ListItem,
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Stack,
  StackDivider,
  useColorModeValue
} from "@chakra-ui/react";
import { fetchActivity, selectRecentActivity, selectTotalUnread, setLastCheckedOn } from "state/artists";
import { useCallback, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "hooks";
import ActivityItem from "components/activityItem";
import { DateTime } from "luxon";
import Icon from "components/icon";
import { Link as RouterLink } from "react-router-dom";
import { faBell, faBolt } from "@fortawesome/free-solid-svg-icons";
import { shallowEqual } from "react-redux";
import { selectActiveProcessList, selectActiveProcessTotal } from "state/user";

const Notifications = () => {
  const badgeColor = useColorModeValue("yellow", "purple");
  const processBadgeColor = useColorModeValue("orange", "yellow");
  const dividerColor = useColorModeValue("blackAlpha.200", "whiteAlpha.200");
  const dispatch = useDispatch();
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
  const activityList = useSelector(selectRecentActivity, shallowEqual);
  const processList = useSelector(selectActiveProcessList, shallowEqual);
  const user = useSelector(state => state.user.userId);
  const numUnread = useSelector(selectTotalUnread);
  const numProcesses = useSelector(selectActiveProcessTotal);

  useEffect(() => {
    dispatch(fetchActivity());
  }, [dispatch]);

  const onOpen = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      const date = DateTime.utc().toISO() as string;
      dispatch(setLastCheckedOn(date));
      if (!user) return;
      window.localStorage.setItem("lastCheckedOn", JSON.stringify({ user, date }));
    }, 3000);
  }, [dispatch, user]);

  const onClose = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  return (
    <>
      <Popover isLazy placement="bottom-end" onOpen={onOpen} onClose={onClose}>
        <Box position="relative">
          <PopoverTrigger>
            <IconButton aria-label="Notifications" icon={<Icon fixedWidth icon={faBell} />} />
          </PopoverTrigger>
          {numUnread > 0 ? (
            <Badge
              colorScheme={badgeColor}
              pointerEvents="none"
              position="absolute"
              right="0"
              top="0"
              transform="translate(25%, -25%)"
            >
              {numUnread}
            </Badge>
          ) : null}
          {numProcesses > 0 ? (
            <Badge
              colorScheme={processBadgeColor}
              pointerEvents="none"
              position="absolute"
              left="0"
              top="0"
              transform="translate(-25%, -25%)"
            >
              <Icon icon={faBolt} />
              {numProcesses}
            </Badge>
          ) : null}
        </Box>
        <PopoverContent overflow="hidden">
          <PopoverBody maxHeight="32rem" overflow="auto" py={0}>
            <List>
              <Stack divider={<StackDivider borderColor={dividerColor} />} spacing={0}>
                {processList.length
                  ? processList.map(process => {
                      const { id, description } = process;

                      return (
                        <ListItem key={id} mx={-3} px={3} py={2}>
                          <Icon color="yellow.200" icon={faBolt} mr={2} />
                          {description}
                        </ListItem>
                      );
                    })
                  : null}
                {processList.length ? <StackDivider borderColor={dividerColor} /> : null}
                {activityList.map(activity => (
                  <ActivityItem activity={activity} key={activity._id} mx={-3} px={3} py={2} />
                ))}
                <Link as={RouterLink} to={"/dashboard/activity"} textAlign="center" px={3} py={2}>
                  See all activity…
                </Link>
              </Stack>
            </List>
          </PopoverBody>
        </PopoverContent>
      </Popover>
    </>
  );
};

export default Notifications;
