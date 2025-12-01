import { createContext } from "react";

const Context = createContext({
  currentPosition: {
    lat: null,
    long: null,
  },
  user: null,
  profileOverview: null,
  savedState: null,
});

export default Context;
