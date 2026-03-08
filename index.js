const express = require("express");
const axios = require("axios");
const app = express();
app.use(express.json());

const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "mybot123";
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

const userMemory = {};

function getHistory(userId) {
  if (!userMemory[userId]) userMemory[userId] = [];
  return userMemory[userId];
}

function addToHistory(userId, role, content) {
  const history = getHistory(userId);
  history.push({ role, content });
  if (history.length > 20) {
    userMemory[userId] = history.slice(history.length - 20);
  }
}

const SYSTEM_PROMPT = `You are a highly intelligent, helpful, and friendly AI assistant on WhatsApp named "Alee Bot".

LANGUAGE RULES:
- Detect the language the user writes in: Urdu script, Roman Urdu, or English
- ALWAYS reply in the SAME language the user used
- If Roman Urdu reply in Roman Urdu
- If Urdu script reply in Urdu script
- If English reply in English
- If mixed use dominant language

PERSONALITY:
- Friendly and warm like a knowledgeable friend
- Honest - if you dont know, say so clearly
- Concise but complete answers
- Never rude or dismissive

ACADEMIC CAPABILITIES:
- Essays, assignments, research papers
- Math problems with step-by-step solutions
- Science, History, Literature explanations
- Any programming language - write and debug code
- Translations between any languages
- Summarize long texts
- Creative writing, stories, poems

IMAGE UNDERSTANDING:
- Analyze images thoroughly
- Answer all questions about images accurately

MEMORY:
- Remember full conversation context
- Refer back to previous messages`;

async function getAIResponse(userId, userMessage, imageUrl) {
  try {
    var messageContent;
    if (imageUrl) {
      messageContent = [
        { type: "image_url", image_url: { url: imageUrl } },
        { type: "text", text: userMessage || "Is image ke baare mein batao" }
      ];
    } else {
      messageContent = userMessage;
    }
    addToHistory(userId, "user", messageContent);
    var messages = [
      { role: "system", content: SYSTEM_PROMPT }
    ].concat(getHistory(userId));
    var model = imageUrl ? "llama-3.2-11b-vision-preview" : "llama-3.3-70b-versatile";
    var response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      { model: model, max_tokens: 1024, messages: messages },
      { headers: { Authorization: "Bearer " + GROQ_API_KEY, "Content-Type": "application/json" } }
    );
    var reply = response.data.choices[0].message.content;
    addToHistory(userId, "assistant", reply);
    return reply;
  } catch (error) {
    console.error("AI Error:", error.message);
    return "Maafi chahta hun, abhi kuch masla aa gaya hai. Thodi der baad dobara try karein";
  }
}

async function sendMessage(to, message) {
  try {
    await axios.post(
      "https://graph.facebook.com/v18.0/" + PHONE_NUMBER_ID + "/messages",
      { messaging_product: "whatsapp", to: to, type: "text", text: { body: message } },
      { headers: { Authorization: "Bearer " + WHATSAPP_TOKEN, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Send Error:", error.message);
  }
}

async function getMediaUrl(mediaId) {
  try {
    var res = await axios.get(
      "https://graph.facebook.com/v18.0/" + mediaId,
      { headers: { Authorization: "Bearer " + WHATSAPP_TOKEN } }
    );
    return res.data.url;
  } catch (error) {
    return null;
  }
}

app.get("/webhook", function(req, res) {
  var mode = req.query["hub.mode"];
  var token = req.query["hub.verify_token"];
  var challenge = req.query["hub.challenge"];
  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

app.post("/webhook", async function(req, res) {
  res.sendStatus(200);
  try {
    var messages = req.body.entry &&
      req.body.entry[0] &&
      req.body.entry[0].changes &&
      req.body.entry[0].changes[0] &&
      req.body.entry[0].changes[0].value &&
      req.body.entry[0].changes[0].value.messages;
    if (!messages || messages.length === 0) return;
    var message = messages[0];
    var from = message.from;
    var msgType = message.type;
    var userText = "";
    var imageUrl = null;
    if (msgType === "text") {
      userText = message.text.body;
    } else if (msgType === "image") {
      imageUrl = await getMediaUrl(message.image.id);
      userText = message.image.caption || "";
    } else if (msgType === "document") {
      userText = "Document mila - is ke baare mein kya jaanna chahte hain?";
    } else if (msgType === "audio" || msgType === "voice") {
      userText = "Voice message mila - please text mein likhein";
    } else {
      return;
    }
    var reply = await getAIResponse(from, userText, imageUrl);
    await sendMessage(from, reply);
  } catch (error) {
    console.error("Webhook Error:", error.message);
  }
});

app.get("/", function(req, res) {
  res.send("Alee Bot is running!");
});

setInterval(function() {
  axios.get("https://whatsapp-bot-vy0u.onrender.com/").catch(function() {});
}, 25000);

var PORT = process.env.PORT || 3000;
app.listen(PORT, function() {
  console.log("Server running on port " + PORT);
});
- Friendly and warm like a knowledgeable friend
- Honest - if you dont know, say so clearly
- Concise but complete answers
- Never rude or dismissive

ACADEMIC CAPABILITIES:
- Essays, assignments, research papers
- Math problems with step-by-step solutions
- Science, History, Literature explanations
- Any programming language - write and debug code
- Translations between any languages
- Summarize long texts
- Creative writing, stories, poems

IMAGE UNDERSTANDING:
- Analyze images thoroughly
- Answer all questions about images accurately

MEMORY:
- Remember full conversation context
- Refer back to previous messages`;

async function getAIResponse(userId, userMessage, imageUrl = null) {
  try {
    let messageContent;
    if (imageUrl) {
      messageContent = [
        { type: "image_url", image_url: { url: imageUrl } },
        { type: "text", text: userMessage || "Is image ke baare mein batao" }
      ];
    } else {
      messageContent = userMessage;
    }
    addToHistory(userId, "user", messageContent);
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...getHistory(userId)
    ];
    const model = imageUrl ? "llama-3.2-11b-vision-preview" : "llama-3.3-70b-versatile";
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      { model, max_tokens: 1024, messages },
      { headers: { Authorization: `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" } }
    );
    const reply = response.data.choices[0].message.content;
    addToHistory(userId, "assistant", reply);
    return reply;
  } catch (error) {
    return "Maafi chahta hun, abhi kuch masla aa gaya hai. Thodi der baad dobara try karein 🙏";
  }
}

async function sendMessage(to, message) {
  try {
    await axios.post(
      `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
      { messaging_product: "whatsapp", to, type: "text", text: { body: message } },
      { headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}`, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Send Error:", error.message);
  }
}

async function getMediaUrl(mediaId) {
  try {
    const res = await axios.get(
      `https://graph.facebook.com/v18.0/${mediaId}`,
      { headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` } }
    );
    return res.data.url;
  } catch (error) {
    return null;
  }
}

app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

app.post("/webhook", async (req, res) => {
  res.sendStatus(200);
  try {
    const messages = req.body.entry?.[0]?.changes?.[0]?.value?.messages;
    if (!messages || messages.length === 0) return;
    const message = messages[0];
    const from = message.from;
    const msgType = message.type;
    let userText = "";
    let imageUrl = null;
    if (msgType === "text") {
      userText = message.text.body;
    } else if (msgType === "image") {
      imageUrl = await getMediaUrl(message.image.id);
      userText = message.image.caption || "";
    } else if (msgType === "document") {
      userText = "Document mila - is ke baare mein kya jaanna chahte hain?";
    } else if (msgType === "audio" || msgType === "voice") {
      userText = "Voice message mila - please text mein likhein 🙏";
    } else { return; }
    const reply = await getAIResponse(from, userText, imageUrl);
    await sendMessage(from, reply);
  } catch (error) {
    console.error("Webhook Error:", error);
  }
});

app.get("/", (req, res) => { res.send("🤖 Alee Bot is running!"); });

// Keep alive - server ko jaag rakhta hai
setInterval(() => {
  axios.get('https://whatsapp-bot-vy0u.onrender.com/')
    .catch(() => {});
}, 25000);
- Friendly and warm like a knowledgeable friend
- Honest - if you dont know, say so clearly
- Concise but complete answers
- Never rude or dismissive

ACADEMIC CAPABILITIES:
- Essays, assignments, research papers
- Math problems with step-by-step solutions
- Science, History, Literature explanations
- Any programming language - write and debug code
- Translations between any languages
- Summarize long texts
- Creative writing, stories, poems

IMAGE UNDERSTANDING:
- Analyze images thoroughly
- Answer all questions about images accurately

MEMORY:
- Remember full conversation context
- Refer back to previous messages`;

async function getAIResponse(userId, userMessage, imageUrl = null) {
  const axios = require("axios");
  try {
    let messageContent;
    if (imageUrl) {
      messageContent = [
        { type: "image_url", image_url: { url: imageUrl } },
        { type: "text", text: userMessage || "Is image ke baare mein batao" }
      ];
    } else {
      messageContent = userMessage;
    }
    addToHistory(userId, "user", messageContent);
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...getHistory(userId)
    ];
    const model = imageUrl ? "llama-3.2-11b-vision-preview" : "llama-3.3-70b-versatile";
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      { model, max_tokens: 1024, messages },
      { headers: { Authorization: `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" } }
    );
    const reply = response.data.choices[0].message.content;
    addToHistory(userId, "assistant", reply);
    return reply;
  } catch (error) {
    return "Maafi chahta hun, abhi kuch masla aa gaya hai. Thodi der baad dobara try karein 🙏";
  }
}

async function sendMessage(to, message) {
  const axios = require("axios");
  try {
    await axios.post(
      `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
      { messaging_product: "whatsapp", to, type: "text", text: { body: message } },
      { headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}`, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Send Error:", error.message);
  }
}

async function getMediaUrl(mediaId) {
  const axios = require("axios");
  try {
    const res = await axios.get(
      `https://graph.facebook.com/v18.0/${mediaId}`,
      { headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` } }
    );
    return res.data.url;
  } catch (error) {
    return null;
  }
}

app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

app.post("/webhook", async (req, res) => {
  res.sendStatus(200);
  try {
    const messages = req.body.entry?.[0]?.changes?.[0]?.value?.messages;
    if (!messages || messages.length === 0) return;
    const message = messages[0];
    const from = message.from;
    const msgType = message.type;
    let userText = "";
    let imageUrl = null;
    if (msgType === "text") {
      userText = message.text.body;
    } else if (msgType === "image") {
      imageUrl = await getMediaUrl(message.image.id);
      userText = message.image.caption || "";
    } else if (msgType === "document") {
      userText = "Document mila - is ke baare mein kya jaanna chahte hain?";
    } else if (msgType === "audio" || msgType === "voice") {
      userText = "Voice message mila - please text mein likhein 🙏";
    } else { return; }
    const reply = await getAIResponse(from, userText, imageUrl);
    await sendMessage(from, reply);
  } catch (error) {
    console.error("Webhook Error:", error);
  }
});

app.get("/", (req, res) => { res.send("🤖 Alee Bot is running!"); });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => { console.log(`Server running on port ${PORT}`); });
