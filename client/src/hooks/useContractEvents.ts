import { useEffect, useState } from "react";

const useContractEvents = (contract: any, filter: any) => {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    if (contract && filter) {
      contract.queryFilter(filter).then(setEvents);
    }
  }, [contract, filter]);

  return events;
};

export default useContractEvents;
