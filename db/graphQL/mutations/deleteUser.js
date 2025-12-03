const { AuthenticationError } = require("apollo-server-express");
const { deleteUserAndRecalculate } = require("../../utils/deleteUser");
const { User } = require("../../models");

const deleteAccountResolver = async (_, { token }) => {
  const user = await User.findOne({ token });

  if (!user) {
    throw new AuthenticationError("User not found");
  }

  await deleteUserAndRecalculate(user._id);

  return true;
};

module.exports = { deleteAccountResolver };
