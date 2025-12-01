export const extractId = (entry) => entry?.id || entry?._id || entry;

const stripDuplicates = (items = []) => {
  const seen = new Set();
  return items.filter((item) => {
    const key = extractId(item);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const mergeSavedList = (list = [], item) => {
  const itemId = extractId(item);
  if (!itemId) return list;

  const filtered = (list || []).filter((entry) => extractId(entry) !== itemId);
  return stripDuplicates([{ ...item, id: itemId }, ...filtered]);
};

export const removeSavedItem = (list = [], itemId) =>
  (list || []).filter((entry) => extractId(entry) !== itemId);

export const isItemSaved = (savedList = [], targetId) => {
  const lookup = new Set((savedList || []).map(extractId));
  return lookup.has(targetId);
};

export const applySavedStateToContext = ({
  state,
  dispatch,
  targetType,
  item,
  saved,
}) => {
  if (!dispatch || !targetType || !item) return { savedPosts: [], savedQuotes: [] };

  const targetId = extractId(item);
  if (!targetId) return { savedPosts: [], savedQuotes: [] };

  const listKey = targetType === "POST" ? "savedPosts" : "savedQuotes";

  const baseSavedPosts =
    state?.savedState?.savedPosts ||
    state?.profileOverview?.savedPosts ||
    state?.user?.savedPosts ||
    [];
  const baseSavedQuotes =
    state?.savedState?.savedQuotes ||
    state?.profileOverview?.savedQuotes ||
    state?.user?.savedQuotes ||
    [];

  const nextSavedPosts =
    targetType === "POST"
      ? saved
        ? mergeSavedList(baseSavedPosts, item)
        : removeSavedItem(baseSavedPosts, targetId)
      : baseSavedPosts;
  const nextSavedQuotes =
    targetType === "QUOTE"
      ? saved
        ? mergeSavedList(baseSavedQuotes, item)
        : removeSavedItem(baseSavedQuotes, targetId)
      : baseSavedQuotes;

  const nextSavedState = {
    savedPosts: nextSavedPosts,
    savedQuotes: nextSavedQuotes,
  };

  dispatch({ type: "SET_SAVED_STATE", payload: nextSavedState });

  const overview = state?.profileOverview;
  if (overview) {
    dispatch({
      type: "SET_PROFILE_OVERVIEW",
      payload: {
        ...overview,
        savedPosts: nextSavedPosts,
        savedQuotes: nextSavedQuotes,
      },
    });
  } else if (state?.user) {
    dispatch({
      type: "SET_PROFILE_OVERVIEW",
      payload: {
        user: state.user,
        posts: [],
        quotes: [],
        savedPosts: nextSavedPosts,
        savedQuotes: nextSavedQuotes,
      },
    });
  }

  const user = state?.user;
  if (user) {
    dispatch({
      type: "SET_USER",
      payload: {
        ...user,
        [listKey]: (saved
          ? mergeSavedList(user[listKey] || [], { id: targetId })
          : removeSavedItem(user[listKey] || [], targetId)
        ).map((entry) => ({ id: extractId(entry) })),
      },
    });
  }

  return nextSavedState;
};
