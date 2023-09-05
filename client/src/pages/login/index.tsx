import {
  Alert,
  AlertIcon,
  AlertTitle,
  Button,
  Center,
  Heading,
  Text,
  VStack,
  useColorModeValue
} from "@chakra-ui/react";
import { fetchUserFavourites, fetchUserWishList } from "state/releases";
import { setIsLoading, updateUser } from "state/user";
import { useDispatch, useSelector } from "hooks";
import { toastSuccess, toastWarning } from "state/toast";
import { useLocation, useNavigate } from "react-router-dom";
import Icon from "components/icon";
import axios from "axios";
import { connectToWeb3 } from "state/web3";
import { faEthereum } from "@fortawesome/free-brands-svg-icons";
import { useState } from "react";

declare const window: any; // eslint-disable-line

const Login = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const isLoading = useSelector(state => state.user.isLoading);
  const navigate = useNavigate();
  const [loginError, setLoginError] = useState("");

  const getNonce = async (address: string) => {
    const res = await axios.get("api/auth/web3", { params: { address } });
    const { message } = res.data;
    return message;
  };

  const checkMessage = async ({ message, signature }: { message: string; signature: string }) => {
    const res = await axios.post("api/auth/web3", { message, signature });
    const { user } = res.data;
    return user;
  };

  const handleWeb3Login = async () => {
    const { ethereum } = window;

    if (ethereum == null) {
      return setLoginError(
        "No suitable web3 login method detected. Please install a web3 wallet (e.g. Metamask) in order to login."
      );
    }

    try {
      setLoginError("");
      dispatch(setIsLoading(true));
      const accounts = await ethereum.request({ method: "eth_requestAccounts" });
      const [address] = accounts;
      const message = await getNonce(address);
      const signature = await ethereum.request({ method: "personal_sign", params: [message, address] });
      const user = await checkMessage({ message, signature });
      dispatch(toastSuccess({ message: "You are now logged in with your Ether wallet.", title: "Logged in" }));
      dispatch(updateUser(user));
      dispatch(fetchUserFavourites());
      dispatch(fetchUserWishList());
      dispatch(connectToWeb3());
      const { pathname } = location.state || {};
      if (pathname) return navigate(pathname);
      navigate("/");
    } catch (error: any) {
      if (error.code === 4001) {
        const message = "Please approve our signature request in order to log in.";
        return void dispatch(toastWarning({ message, title: "Login cancelled" }));
      }

      if (error.code === -32002) {
        const message = "Please complete the unlock/login process in your web3 wallet before retrying.";
        return void setLoginError(message);
      }

      setLoginError(
        "We were unable to start the sign-in process. Do you have a web3 wallet installed (e.g. Metamask)?"
      );
    } finally {
      dispatch(setIsLoading(false));
    }
  };

  return (
    <Center flex={1}>
      <VStack spacing={8}>
        <Heading as="h2" fontSize="5xl" m={0}>
          Log In
        </Heading>
        <Button
          colorScheme={useColorModeValue("yellow", "purple")}
          leftIcon={<Icon icon={faEthereum} />}
          isLoading={isLoading}
          loadingText="Logging in…"
          size="lg"
          minWidth="24rem"
          onClick={handleWeb3Login}
          mb={8}
        >
          Log in with your Ethereum wallet
        </Button>
        {loginError ? (
          <Alert status="warning">
            <AlertIcon />
            <AlertTitle mr={2}>Warning</AlertTitle>
            {loginError}
          </Alert>
        ) : (
          <Text textAlign="center" fontSize="xl">
            Welcome to Gridfire.
            <br />
            Please use your web3 wallet to log in (e.g. Metamask).
          </Text>
        )}
      </VStack>
    </Center>
  );
};

export default Login;
