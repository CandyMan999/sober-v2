const axios = require("axios");

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

const createChatCompletion = async (payload) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const response = await axios.post(OPENAI_API_URL, payload, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });

  return response.data;
};

module.exports = {
  chat: {
    completions: {
      create: createChatCompletion,
    },
  },
};
