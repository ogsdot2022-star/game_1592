import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const modelName = 'gemini-2.5-flash';

export const generateDailyLog = async (day: number, food: number, survivors: number): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: `
        You are writing a short, gritty, one-sentence diary entry for a leader of a Korean Righteous Army (Uibyeong) during the Imjin War (1592).
        Day: ${day}.
        Current Food: ${food}.
        Surviving Soldiers: ${survivors}.
        The tone should be desperate but determined. Korean language only.
      `,
    });
    return response.text || `임진년, 전쟁이 시작된 지 ${day}일째다. 우리는 아직 살아있다.`;
  } catch (error) {
    console.error("Gemini Error:", error);
    return `임진년, 전쟁이 시작된 지 ${day}일째다. 안개가 짙다.`;
  }
};

export const generateSoldierBackstory = async (soldierName: string, soldierClass: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: `Create a very short (1 sentence) tragic backstory for a ${soldierClass} named ${soldierName} joining the Righteous Army during the Imjin War. Korean language.`,
    });
    return response.text || "고향을 잃고 복수를 위해 칼을 잡았다.";
  } catch (error) {
    return "알 수 없는 과거를 가진 자다.";
  }
};

export const generateBattleDescription = async (enemyName: string, outcome: 'win' | 'lose' | 'start'): Promise<string> => {
   try {
    const prompt = outcome === 'start' 
      ? `Describe a frightening encounter with ${enemyName} in a dark forest during the Imjin War. 1 short sentence. Korean.`
      : outcome === 'win' 
      ? `Describe the victory over ${enemyName} briefly and grimly. 1 short sentence. Korean.`
      : `Describe a retreat from ${enemyName}. 1 short sentence. Korean.`;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
    });
    return response.text || (outcome === 'start' ? `${enemyName}가 나타났다!` : "전투가 끝났다.");
  } catch (error) {
    return outcome === 'start' ? `${enemyName}와 마주쳤다.` : "전투 종료.";
  }
}