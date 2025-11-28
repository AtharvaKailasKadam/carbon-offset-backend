import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

export async function analyzeCarbon({ industryName, carbonEmissionTons, region, industryType }) {
  const prompt = `You are a carbon offset expert.

Industry: ${industryName}
Type: ${industryType}
Region: ${region}
CO2 Emissions: ${carbonEmissionTons} tons/year

Calculate:
1. Trees needed (average tree absorbs 21kg CO2/year)
2. Best tree species for ${region}
3. Additional offset strategies

Respond ONLY with JSON (no markdown):
{
  "treesRequired": number,
  "reasoning": "explanation",
  "species": ["species1", "species2", "species3"],
  "strategies": ["strategy1", "strategy2"]
}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Gemini error:', error);
    
    // Fallback calculation if AI fails
    const treesRequired = Math.ceil((carbonEmissionTons * 1000) / 21);
    return {
      treesRequired,
      reasoning: `Based on average absorption of 21kg CO2/year per tree, ${treesRequired} trees are needed.`,
      species: ['Oak', 'Pine', 'Maple'],
      strategies: ['Renewable energy', 'Energy efficiency']
    };
  }
}