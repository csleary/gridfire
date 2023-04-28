import { Button, Center, Flex, useColorModeValue } from "@chakra-ui/react";
import Icon from "components/icon";
import { faCheck, faPlus } from "@fortawesome/free-solid-svg-icons";
import { useCallback, useEffect, useState } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { shallowEqual } from "react-redux";
import { useSelector } from "hooks";

const Follow = () => {
  const accentColor = useColorModeValue("yellow.500", "purple.300");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const location = useLocation();
  const navigate = useNavigate();
  const { artistId: artistIdParam, artistSlug } = useParams();
  const { account } = useSelector(state => state.user, shallowEqual);
  const [followerCount, setFollowerCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchArtistId = useCallback(async () => {
    const res = await axios.get(`/api/artist/${artistSlug}/id`);
    const { _id } = res.data;
    return _id;
  }, [artistSlug]);

  const fetchIsFollowing = useCallback(async () => {
    try {
      setIsLoading(true);
      let artistId = artistIdParam;
      if (!artistId) artistId = await fetchArtistId();
      const res = await axios.get(`/api/artist/${artistId}/followers`);
      const { isFollowing, numFollowers } = res.data;
      setIsFollowing(isFollowing);
      setFollowerCount(numFollowers);
    } catch (error: any) {
      console.error(error.response?.data.error || error.message);
    } finally {
      setIsLoading(false);
    }
  }, [artistIdParam, fetchArtistId]);

  useEffect(() => {
    fetchIsFollowing();
  }, [fetchIsFollowing]);

  const handleClick = async () => {
    try {
      if (!account) return navigate("/login", { state: { pathname: location.pathname } });
      setIsLoading(true);
      let artistId = artistIdParam;
      if (!artistId) artistId = await fetchArtistId();

      if (isFollowing) {
        await axios.delete(`/api/artist/${artistId}/follow`);
        setIsFollowing(false);
        return;
      }

      await axios.post(`/api/artist/${artistId}/follow`);
      setIsFollowing(true);
    } catch (error: any) {
      console.error(error.response?.data.error || error.message);
    } finally {
      fetchIsFollowing();
      setIsLoading(false);
    }
  };

  return (
    <Flex alignItems="center">
      <Button
        justifyContent="space-between"
        leftIcon={<Icon color={isFollowing ? accentColor : undefined} icon={isFollowing ? faCheck : faPlus} />}
        isLoading={isLoading}
        minWidth="8rem"
        mr={2}
        onClick={handleClick}
        onMouseOver={() => setIsHovering(true)}
        onMouseOut={() => setIsHovering(false)}
      >
        {isFollowing && isHovering ? "Unfollow" : isFollowing ? "Following" : "Follow"}
      </Button>
      <Center borderColor={borderColor} borderRadius="md" borderWidth="2px" fontWeight="500" height={10} px={4}>
        {followerCount}
      </Center>
    </Flex>
  );
};

export default Follow;
