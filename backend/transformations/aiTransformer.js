export const aiTransformer = {
  toAtsScoreResponse(rawAiText) {
    try {
      const jsonMatch = rawAiText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          score: parsed.score ?? 0,
          matches: parsed.matches || parsed.strengths || [],
          improvements: parsed.improvements || parsed.weaknesses || [],
          strengths: parsed.matches || parsed.strengths || [],
          weaknesses: parsed.improvements || parsed.weaknesses || [],
          summary: parsed.summary || '',
        };
      }
      throw new Error("No JSON found in AI response");
    } catch (error) {
      console.error("Failed to parse AI response:", rawAiText);
      return {
        score: 0,
        matches: [],
        improvements: ["Failed to parse AI analysis. Please try again."],
        strengths: [],
        weaknesses: ["Failed to parse AI analysis. Please try again."],
        summary: "Error generating ATS score."
      };
    }
  },

  toRecommendationsResponse(rawAiText) {
    try {
      const jsonMatch = rawAiText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error("No JSON array found in AI response");
    } catch (error) {
      console.error("Failed to parse AI recommendations:", rawAiText);
      return [];
    }
  }
};
