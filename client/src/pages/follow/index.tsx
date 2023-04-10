import { Button, Flex, useColorModeValue } from "@chakra-ui/react";
import Icon from "components/icon";
import { faCheck, faPlus } from "@fortawesome/free-solid-svg-icons";
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

const Follow = () => {
  const accentColor = useColorModeValue("yellow.500", "purple.300");
  const { artistId: artistIdParam, artistSlug } = useParams();
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
      const res = await axios.get(`/api/artist/${artistId}/following`);
      const { isFollowing } = res.data;
      setIsFollowing(isFollowing);
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
      setIsLoading(false);
    }
  };

  return (
    <Flex>
      <Button
        justifyContent="space-between"
        leftIcon={<Icon color={isFollowing ? accentColor : undefined} icon={isFollowing ? faCheck : faPlus} />}
        isLoading={isLoading}
        minWidth="8rem"
        onClick={handleClick}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {isFollowing && isHovering ? "Unfollow" : isFollowing ? "Following" : "Follow"}
      </Button>
    </Flex>
  );
};

export default Follow;
