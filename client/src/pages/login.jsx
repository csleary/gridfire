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
import { setIsLoading, updateUser } from "state/user";
import { toastError, toastSuccess } from "state/toast";
import { useLocation, useNavigate } from "react-router-dom";
import Icon from "components/icon";
import axios from "axios";
import { connectToWeb3 } from "state/web3";
import { faEthereum } from "@fortawesome/free-brands-svg-icons";
import { useDispatch } from "react-redux";
import { useState } from "react";

const Login = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const [loginError, setLoginError] = useState("");

  const getNonce = async address => {
    const res = await axios.get("api/auth/web3", { params: { address } });
    const { message } = res.data;
    return message;
  };

  const checkMessage = async ({ message, signature }) => {
    const res = await axios.post("api/auth/web3", { message, signature });
    const { user } = res.data;
    return user;
  };

  const handleWeb3Login = async () => {
    const { ethereum } = window;

    if (ethereum != null) {
      try {
        setLoginError("");
        const accounts = await ethereum.request({ method: "eth_requestAccounts" });
        const [address] = accounts;
        const message = await getNonce(address);
        const signature = await ethereum.request({ method: "personal_sign", params: [message, address] });
        const user = await checkMessage({ message, signature });
        dispatch(toastSuccess({ message: "You are now logged in with your Ether wallet.", title: "Logged in" }));
        dispatch(updateUser(user));
        dispatch(connectToWeb3());
        const { pathname } = location.state || {};
        if (pathname) return navigate(pathname);
        navigate("/");
      } catch (error) {
        if (error.code === 4001) {
          return void dispatch(toastError({ message: error.message, title: "Error" }));
        }

        setLoginError(
          "We were unable to start the sign-in process. Do you have a web3 wallet installed (e.g. Metamask)?"
        );
      } finally {
        dispatch(setIsLoading(false));
      }
    } else {
      setLoginError(
        "No suitable web3 login method detected. Please install a web3 wallet (e.g. Metamask) in order to login."
      );
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
          size="lg"
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
            Welcome to GridFire.
            <br />
            Please use your web3 wallet to log in (e.g. Metamask).
          </Text>
        )}
      </VStack>
    </Center>
  );
};

export default Login;
