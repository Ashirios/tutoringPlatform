const express = require("express");
const { getGroqChatCompletion } = require("./ai.js");
const cors = require("cors");
const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/chat", async (req, res) => {
  try {
    const { question_text, option_a, option_b, option_c, option_d, answer, type, user_message, history } = req.body;

    if (!question_text || !user_message) {
      return res.status(400).json({ error: "question_text and user_message are required" });
    }

    const completion = await getGroqChatCompletion({ question_text, option_a, option_b, option_c, option_d, answer, user_message, history });

    res.json({ reply: completion.choices[0].message.content });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

const PORT = process.env.PORT || 3005;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
