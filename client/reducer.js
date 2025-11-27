export default function reducer(state, { type, payload }) {
  switch (type) {
    case "NEW_QUOTE":
      return {
        ...state,
        newQuote: payload,
      };

    case "SET_USER":
      return {
        ...state,
        user: payload,
      };

    case "SET_PROFILE_OVERVIEW":
      return {
        ...state,
        profileOverview: payload,
      };

    case "CURRENT_POSITION":
      return {
        ...state,
        currentPosition: {
          lat: payload.lat,
          long: payload.long,
        },
      };

    case "SET_DATE":
      return {
        ...state,
        date: payload,
      };

    case "LOCATION_PERMISSION":
      return {
        ...state,
        locationPermission: payload,
      };

    default:
      return state;
  }
}
