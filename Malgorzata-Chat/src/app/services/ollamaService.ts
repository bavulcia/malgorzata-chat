export class OllamaService {
  // Pobieramy klucz z Twoich ustawień Vercel
  private apiKey = import.meta.env.VITE_GROQ_API_KEY; 
  private apiUrl = "https://api.groq.com/openai/v1/chat/completions";

  // Sprawia, że kropka w ustawieniach jest zielona
  async checkStatus(): Promise<boolean> {
    return true; 
  }

  // Wypełnia listę modeli w menu
  async getModels(): Promise<string[]> {
    return ["llama-3.1-70b-versatile", "llama3-8b-8192"];
  }

  // Główna funkcja rozmowy
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
            { 
              role: "system", 
              content: "Jesteś Małgorzata Chat, asystentem stworzonym do pomocy. Odpowiadaj krótko, uprzejmie i zawsze po polsku." 
            },
            ...history.map(m => ({
              role: m.sender === 'user' ? 'user' : 'assistant',
              content: m.text
            })),
            { role: "user", content: userMessage }
          ],
          temperature: 0.7
        })
      });

      const data = await response.json();

      if (data.error) {
        console.error("Błąd API:", data.error);
        return `Błąd AI: ${data.error.message}`;
      }

      if (data.choices && data.choices[0]) {
        return data.choices[0].message.content;
      }

      return "Przepraszam, ale nie otrzymałam odpowiedzi.";
    } catch (error) {
      console.error("Błąd fetch:", error);
      return "Błąd: Brak połączenia z internetem lub klucz API nie działa.";
    }
  }
}

// Eksportujemy stałą, której szuka App.tsx
export const ollamaService = new OllamaService();
