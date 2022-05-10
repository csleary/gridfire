import { shallowEqual, useSelector } from "react-redux";
import { useContext, useEffect } from "react";
import { Web3Context } from "index";
import { daiAbi } from "web3/dai";
import { getDaiContract } from "web3/contract";
import { utils } from "ethers";

const useContractEvents = () => {
  const provider = useContext(Web3Context);
  const { account } = useSelector(state => state.web3, shallowEqual);

  useEffect(() => {
    if (account && provider) {
      const dai = getDaiContract(provider);
      const iface = new utils.Interface(daiAbi);
      const filter = dai.filters.Transfer(null, account); // DAI transfers to my account.

      provider.once(filter, log => {
        const { args, name } = iface.parseLog(log);
        const [from, to, bigNum] = args;
        const amount = utils.formatEther(bigNum);
        console.log(name, from, to, amount);
      });
    }
  }, [account, provider]);
};

export default useContractEvents;
