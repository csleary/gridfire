import { Alert, AlertIcon, Button, Center, Heading, Text, VStack } from "@chakra-ui/react";
import { setAccount, setIsConnected } from "features/web3";
import { setIsLoading, updateUser } from "features/user";
import { toastError, toastSuccess } from "features/toast";
import { useLocation, useNavigate } from "react-router-dom";
import Icon from "components/icon";
import axios from "axios";
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

    if (ethereum !== "undefined") {
      try {
        setLoginError("");
        const accounts = await ethereum.request({ method: "eth_requestAccounts" });
        const [address] = accounts;
        const message = await getNonce(address);
        const signature = await ethereum.request({ method: "personal_sign", params: [message, address] });
        const user = await checkMessage({ message, signature });
        dispatch(setAccount(address));
        dispatch(setIsConnected(true));
        dispatch(updateUser(user));
        dispatch(toastSuccess("You are now logged in with your Ether wallet."));
        const { pathname } = location.state || {};
        if (pathname) return navigate(pathname);
        navigate("/");
      } catch (error) {
        if (error.code === 4001) {
          return void dispatch(toastError(error.message));
        }

        setLoginError(
          "We were unable to start the sign-in process. Do you have a web3 wallet installed (e.g. Metamask)?"
        );
      } finally {
        dispatch(setIsLoading(false));
      }
    }
  };

  return (
    <Center flex={1}>
      <VStack spacing={8}>
        <Heading as="h2" fontSize="5xl" m={0}>
          Log In
        </Heading>
        <Button leftIcon={<Icon icon={faEthereum} />} size="lg" onClick={handleWeb3Login} mb={8}>
          Log in with your Ethereum wallet
        </Button>
        {loginError ? (
          <Alert className="alert alert-danger">
            <AlertIcon />
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
