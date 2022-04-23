import { useContext } from "react";
import { utils } from "ethers";
import { Web3Context } from "index";

const { REACT_APP_CONTRACT_ADDRESS } = process.env;

const useContractEvents = () => {
  const provider = useContext(Web3Context);

  const filter = {
    address: REACT_APP_CONTRACT_ADDRESS,
    topics: [utils.id("PaymentReceived(address,uint256)")]
  };

  provider.on(filter, (log, event) => {
    console.log(event);
  });

  provider.on("block", blockNumber => {
    console.log(blockNumber);
  });
};

export default useContractEvents;
