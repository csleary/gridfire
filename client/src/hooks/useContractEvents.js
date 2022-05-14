import { useEffect, useState } from "react";

const useContractEvents = (contract, filter) => {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    if (contract && filter) {
      contract.queryFilter(filter).then(setEvents);
    }
  }, [contract, filter]);

  return events;
};

export default useContractEvents;
