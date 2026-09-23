import { useState, useEffect } from "react";
import { clientService } from "../data/mockClients.js";
export function useClientSearch(query, setNotice) {
  const [clients, setClients] = useState([]);
  useEffect(() => {
    let active = true;
    clientService
      .search(query)
      .then((result) => {
        if (active) setClients(result);
      })
      .catch((e) => setNotice({ type: "error", text: e.message }));
    return () => {
      active = false;
    };
  }, [query]);
  return clients;
}
