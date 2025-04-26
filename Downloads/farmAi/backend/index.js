const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI("AIzaSyDkPqCXAO4wEMziBttDeGjPO33-hpe8D_k");

// **Define model once here**
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// API endpoint
app.post("/api/farmerQuestion", async (req, res) => {
  const { question } = req.body;

  try {
    console.log("Received question:", question);

    const result = await model.generateContent(question);
    const response = await result.response;
    const geminiResponseText = response.candidates[0].content.parts[0].text;

    const matchedPolicy = await matchPolicyWithQuestion(geminiResponseText);
    res.json({ policy: matchedPolicy });
  } catch (error) {
    console.error("Error processing question:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// Match policies from TEXT files now
const matchPolicyWithQuestion = async (geminiResponseText) => {
  const policyDir = path.join(__dirname, "policies");
  const policyFiles = fs.readdirSync(policyDir);
  let matchedPolicy = null;

  for (let file of policyFiles) {
    const filePath = path.join(policyDir, file);
    const fileContent = await readText(filePath);

    if (fileContent.includes(geminiResponseText)) {
      matchedPolicy = { file, content: fileContent };
      break;
    }
  }
  return matchedPolicy;
};

// Read TEXT file
const readText = async (filePath) => {
  return fs.promises.readFile(filePath, 'utf8');
};

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

