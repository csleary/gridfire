import {
  Badge,
  Box,
  IconButton,
  Link,
  List,
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
import { faBell } from "@fortawesome/free-solid-svg-icons";
import { shallowEqual } from "react-redux";

const Notifications = () => {
  const color = useColorModeValue("yellow", "purple");
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const dispatch = useDispatch();
  const activityList = useSelector(selectRecentActivity, shallowEqual);
  const user = useSelector(state => state.user.userId);
  const numUnread = useSelector(selectTotalUnread);

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
              colorScheme={color}
              pointerEvents="none"
              position="absolute"
              right="0"
              top="0"
              transform="translate(25%, -25%)"
            >
              {numUnread}
            </Badge>
          ) : null}
        </Box>
        <PopoverContent>
          <PopoverBody maxHeight="32rem" overflow="auto">
            <List>
              <Stack divider={<StackDivider borderColor={useColorModeValue("blackAlpha.200", "whiteAlpha.200")} />}>
                {activityList.map(activity => (
                  <ActivityItem activity={activity} key={activity._id} />
                ))}
                <Link as={RouterLink} to={"/dashboard/activity"} textAlign="center">
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
