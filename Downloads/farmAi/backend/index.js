const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI("YOUR_GEMINI_API_KEY"); // Replace with your API key

// Define model once
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// API endpoint
app.post("/api/farmerQuestion", async (req, res) => {
  const { question } = req.body;

  try {
    console.log("Received question:", question);

    const result = await model.generateContent(question);
    const response = await result.response;
    const geminiResponseText = response.candidates[0].content.parts[0].text;

    // 💥 SMART: Split the Gemini response into points
    const points = geminiResponseText
      .split(/\n|\d+\.\s+/) // Split by newlines or numbered lists (like 1. 2. 3.)
      .map(p => p.trim())
      .filter(p => p.length > 0); // Remove empty lines

    const matchedPolicy = await matchPolicyWithQuestion(geminiResponseText);

    // Send both full text and points separately
    res.json({
      fullText: geminiResponseText,
      points: points,
      policy: matchedPolicy
    });

  } catch (error) {
    console.error("Error processing question:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// Match policies from Texts (Not PDFs now)
const matchPolicyWithQuestion = async (geminiResponseText) => {
  const policyDir = path.join(__dirname, "policies");
  const policyFiles = fs.readdirSync(policyDir);
  let matchedPolicy = null;

  for (let file of policyFiles) {
    const filePath = path.join(policyDir, file);
    const fileContent = await readText(filePath);

    if (fileContent.toLowerCase().includes(geminiResponseText.toLowerCase())) {
      matchedPolicy = { file, content: fileContent };
      break;
    }
  }
  return matchedPolicy;
};

// Read text file
const readText = async (filePath) => {
  const dataBuffer = fs.readFileSync(filePath, 'utf8');
  return dataBuffer;
};

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
