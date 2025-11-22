const getDistanceFromCoords = (lat1, lng1, lat2, lng2) => {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2 - lat1); // deg2rad below
  var dLng = deg2rad(lng2 - lng1);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c; // Distance in km
  return d * 0.621371 * 5280; //returning distance in feet
};

const deg2rad = (deg) => deg * (Math.PI / 180);

const removeDuplicates = async (data) => {
  let newData = [];
  for (let i = 0; i < data.length; i++) {
    if (
      newData.every(
        (obj) =>
          obj.name !== data[i].name ||
          (obj.lat !== data[i].lat && obj.long !== data[i].long)
      )
    ) {
      newData = [...newData, data[i]];
    }
  }
  return newData;
};

module.exports = {
  removeDuplicates,
  getDistanceFromCoords,
};
