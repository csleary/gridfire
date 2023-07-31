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
import ActivityItem from "components/activityItem";
import { BellIcon } from "@chakra-ui/icons";
import { Link as RouterLink } from "react-router-dom";
import { useDispatch, useSelector } from "hooks";
import { shallowEqual } from "react-redux";
import { useEffect, useRef } from "react";

const Notifications = () => {
  const color = useColorModeValue("yellow", "purple");
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const dispatch = useDispatch();
  const activityList = useSelector(selectRecentActivity, shallowEqual);
  const numUnread = useSelector(selectTotalUnread);

  useEffect(() => {
    dispatch(fetchActivity());
  }, [dispatch]);

  const onOpen = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      dispatch(setLastCheckedOn());
    }, 3000);
  };

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
            <IconButton aria-label="Notifications" icon={<BellIcon />} />
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
