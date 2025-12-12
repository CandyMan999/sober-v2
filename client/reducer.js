export default function reducer(state, { type, payload }) {
  switch (type) {
    case "APPEND_PROFILE_QUOTE": {
      if (!payload) return state;
      const overview = state?.profileOverview || {};
      const existingQuotes = overview.quotes || [];

      return {
        ...state,
        profileOverview: {
          ...overview,
          quotes: [...existingQuotes, payload],
        },
      };
    }

    case "SET_USER": {
      return {
        ...state,
        user: payload,
      };
    }

    case "SET_PROFILE_OVERVIEW": {
      return {
        ...state,
        profileOverview: payload,
      };
    }

    case "SET_SAVED_STATE": {
      return {
        ...state,
        savedState: payload,
      };
    }

    case "CURRENT_POSITION": {
      return {
        ...state,
        currentPosition: {
          lat: payload.lat,
          long: payload.long,
        },
      };
    }

    case "SET_DATE": {
      return {
        ...state,
        date: payload,
      };
    }

    case "LOCATION_PERMISSION": {
      return {
        ...state,
        locationPermission: payload,
      };
    }

    default:
      return state;
  }
}
