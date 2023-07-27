import { useEffect, useState } from "react";
import { Contract, ContractEventName, EventLog, Log } from "ethers";

const useContractEvents = (contract: Contract, filter: ContractEventName) => {
  const [events, setEvents] = useState<EventLog[] | Log[]>([]);

  useEffect(() => {
    if (contract && filter) {
      contract.queryFilter(filter).then(setEvents);
    }
  }, [contract, filter]);

  return events;
};

export default useContractEvents;
