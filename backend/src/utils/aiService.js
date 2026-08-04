const OpenAI = require('openai');

let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

exports.evaluateDescriptiveAnswer = async (questionText, studentAnswer, rubric) => {
  if (!process.env.OPENAI_API_KEY) {
    console.warn("OpenAI API key missing. Returning mocked AI evaluation.");
    return {
      conceptUnderstanding: 8,
      technicalAccuracy: 7,
      logicalExplanation: 8,
      grammar: 9,
      strengths: ["Clear explanation", "Good sentence structure"],
      suggestions: ["Include more specific examples", "Use more precise technical terms"]
    };
  }

  try {
    const prompt = `
      You are an expert technical evaluator. Evaluate the student's descriptive answer to the following question.
      
      Question: "${questionText}"
      Evaluation Rubric / Keywords: "${rubric || 'Standard technical evaluation'}"
      Student Answer: "${studentAnswer}"

      Provide your evaluation in the following strict JSON format. Do not include markdown blocks or any other text, only valid JSON:
      {
        "conceptUnderstanding": <number 0-10>,
        "technicalAccuracy": <number 0-10>,
        "logicalExplanation": <number 0-10>,
        "grammar": <number 0-10>,
        "strengths": ["<strength 1>", "<strength 2>"],
        "suggestions": ["<suggestion 1>", "<suggestion 2>"]
      }
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview", // or gpt-3.5-turbo
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    });

    const resultText = response.choices[0].message.content.trim();
    // In case the model wrapped it in markdown json block
    const cleanedJson = resultText.replace(/```json/g, '').replace(/```/g, '');
    
    return JSON.parse(cleanedJson);
  } catch (error) {
    console.error("AI Evaluation failed:", error);
    throw new Error("Failed to evaluate answer using AI.");
  }
};
