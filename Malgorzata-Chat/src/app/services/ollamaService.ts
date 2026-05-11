export class OllamaService {
  private apiKey = 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; 
  private apiUrl = "https://api.groq.com/openai/v1/chat/completions";

  async checkStatus(): Promise<boolean> {
    return true; 
  }

  // Ta funkcja wypełni listę modeli w ustawieniach
  async getModels(): Promise<string[]> {
    return ["llama-3.1-70b-versatile"];
  }

  // To jest główna funkcja, której szuka App.tsx
  async generateResponse(userMessage: string, history: any[], model: string): Promise<string> {
    try {
      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.1-70b-versatile",
          messages: [
            { role: "system", content: "Jesteś Małgorzata Chat. Odpowiadaj krótko i po polsku." },
            ...history.map(m => ({
              role: m.sender === 'user' ? 'user' : 'assistant',
              content: m.text
            })),
            { role: "user", content: userMessage }
          ]
        })
      });

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      return "Błąd: Nie udało się połączyć z AI w chmurze.";
    }
  }
}

// Ten eksport jest kluczowy, by App.tsx widział te funkcje
export const ollamaService = new OllamaService();





