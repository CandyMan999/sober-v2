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
  if (!dispatch || !targetType || !item) return;

  const targetId = extractId(item);
  if (!targetId) return;

  const overview = state?.profileOverview || {};
  const listKey = targetType === "POST" ? "savedPosts" : "savedQuotes";

  const existingOverviewList = overview[listKey] || state?.user?.[listKey] || [];

  const nextOverview = {
    ...overview,
    user: overview.user || state?.user || null,
    posts: overview.posts || [],
    quotes: overview.quotes || [],
  };
  nextOverview[listKey] = saved
    ? mergeSavedList(existingOverviewList, item)
    : removeSavedItem(existingOverviewList, targetId);

  dispatch({ type: "SET_PROFILE_OVERVIEW", payload: nextOverview });

  const user = state?.user;
  if (user) {
    const existing = user[listKey] || [];
    const normalizedExisting = existing.map((entry) =>
      entry?.id || entry?._id ? { id: extractId(entry) } : entry
    );

    const updatedList = saved
      ? mergeSavedList(normalizedExisting, { id: targetId })
      : removeSavedItem(normalizedExisting, targetId);

    dispatch({ type: "SET_USER", payload: { ...user, [listKey]: updatedList } });
  }
};
