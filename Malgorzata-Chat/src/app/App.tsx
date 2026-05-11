import { useState, useRef, useEffect } from 'react';
import { Plus, Send, Menu, X, Circle } from 'lucide-react';
import { ollamaService } from './services/ollamaService';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [activeModel, setActiveModel] = useState('llama3.2');
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [showCorsHelp, setShowCorsHelp] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Check Ollama status and get available models
  const checkOllamaStatus = async () => {
    const isConnected = await ollamaService.checkStatus();
    if (isConnected) {
      setOllamaStatus('connected');
      setShowCorsHelp(false);
      const models = await ollamaService.getModels();
      setAvailableModels(models);
    } else {
      setOllamaStatus('disconnected');
      setShowCorsHelp(true);
    }
  };

  useEffect(() => {
    checkOllamaStatus();
    const interval = setInterval(checkOllamaStatus, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const quickActions = [
    'Utwórz obraz',
    'Znajdź najlepszą ofertę',
    'Przetwórz przychód',
    'Rozsądna lista',
    'Popraw pisanie',
    'Utwórz krótką wiadomość',
    'Skoryguj propozycję',
    'Wysyłaj porady'
  ];

  const getAIResponseFromOllama = async (userMessage: string, conversationHistory: Message[]): Promise<string> => {
    return await ollamaService.generateResponse(userMessage, conversationHistory, activeModel);
  };

  const handleSendMessage = async (text?: string) => {
    const messageText = text || inputValue.trim();
    if (!messageText) return;

    const userMessage: Message = {
      id: Date.now(),
      text: messageText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Get AI response from Ollama
    const responseText = await getAIResponseFromOllama(messageText, messages);

    const aiResponse: Message = {
      id: Date.now() + 1,
      text: responseText,
      sender: 'ai',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, aiResponse]);
    setIsTyping(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="size-full flex items-center justify-center bg-[#f5f5f0]">
      <div className="w-full max-w-3xl h-full flex flex-col p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 mt-4">
          <div className="flex-1"></div>
          <h1 className="text-center">Małgorzata Chat</h1>
          <div className="flex-1 flex justify-end">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 hover:bg-white/50 rounded-lg transition-colors"
            >
              {isMenuOpen ? (
                <X className="w-6 h-6 text-foreground" />
              ) : (
                <Menu className="w-6 h-6 text-foreground" />
              )}
            </button>
          </div>
        </div>

        {/* Settings Menu */}
        {isMenuOpen && (
          <div className="mb-4 bg-white rounded-2xl border border-border p-4 shadow-lg">
            <h3 className="mb-4">Ustawienia</h3>

            {/* Ollama Status */}
            <div className="mb-4 pb-4 border-b border-border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">Status Ollama:</span>
                <div className="flex items-center gap-2">
                  <Circle
                    className={`w-3 h-3 ${
                      ollamaStatus === 'connected'
                        ? 'fill-green-500 text-green-500'
                        : ollamaStatus === 'disconnected'
                        ? 'fill-red-500 text-red-500'
                        : 'fill-yellow-500 text-yellow-500'
                    }`}
                  />
                  <span className="text-sm">
                    {ollamaStatus === 'connected'
                      ? 'Połączono'
                      : ollamaStatus === 'disconnected'
                      ? 'Rozłączono'
                      : 'Sprawdzanie...'}
                  </span>
                </div>
              </div>
              {ollamaStatus === 'disconnected' && showCorsHelp && (
                <div className="mt-3 p-3 bg-muted rounded-lg">
                  <p className="text-xs mb-2">
                    Aby połączyć się z Ollama z przeglądarki, uruchom Ollama z konfiguracją CORS:
                  </p>
                  <div className="bg-background p-2 rounded text-xs font-mono mb-2">
                    <div className="mb-1"># Windows (PowerShell):</div>
                    <div className="mb-2">$env:OLLAMA_ORIGINS="*"; ollama serve</div>
                    <div className="mb-1"># Mac/Linux:</div>
                    <div>OLLAMA_ORIGINS=* ollama serve</div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Lub zainstaluj rozszerzenie przeglądarki do obsługi CORS
                  </p>
                </div>
              )}
            </div>

            {/* Active Model */}
            <div>
              <label className="text-sm mb-2 block">Aktywny model:</label>
              <select
                value={activeModel}
                onChange={(e) => setActiveModel(e.target.value)}
                className="w-full p-2 border border-border rounded-lg bg-background"
                disabled={ollamaStatus !== 'connected'}
              >
                <option value="llama3.2">llama3.2</option>
                {availableModels
                  .filter(model => model !== 'llama3.2')
                  .map(model => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
              </select>
              {ollamaStatus === 'connected' && availableModels.length === 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  Nie znaleziono modeli. Uruchom: ollama pull llama3.2
                </p>
              )}
            </div>
          </div>
        )}

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto mb-6 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center space-y-6">
                <div className="space-y-2">
                  <p className="text-muted-foreground">
                    Wyślij wiadomość do funkcji Małgorzata Chat
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.sender === 'user'
                        ? 'bg-[#0066cc] text-white'
                        : 'bg-white text-foreground border border-border'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.text}</p>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white text-foreground border border-border rounded-2xl px-4 py-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="space-y-4">
          {/* Input Field */}
          <div className="relative">
            <div className="flex items-center gap-2 bg-white rounded-full border-2 border-[#6b9ce8] px-4 py-3 shadow-sm">
              <button
                className="flex-shrink-0 w-6 h-6 rounded-full bg-transparent hover:bg-muted flex items-center justify-center transition-colors"
                onClick={() => {
                  // Placeholder for attach functionality
                  console.log('Attach clicked');
                }}
              >
                <Plus className="w-5 h-5 text-muted-foreground" />
              </button>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Wyślij wiadomość do funkcji Małgorzata Chat"
                className="flex-1 bg-transparent outline-none border-none"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputValue.trim()}
                className="flex-shrink-0 w-8 h-8 rounded-full bg-[#0066cc] hover:bg-[#0052a3] disabled:bg-muted disabled:cursor-not-allowed flex items-center justify-center transition-colors"
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          {messages.length === 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => handleSendMessage(action)}
                  className="px-3 py-2 bg-white border border-border rounded-full hover:bg-muted transition-colors text-sm"
                >
                  {action}
                </button>
              ))}
            </div>
          )}

          {/* Footer Text */}
          <p className="text-center text-xs text-muted-foreground">
            Funkcja Małgorzata Chat to oficjalne narzędzie wspiera popełnić błędy. Korzystając z funkcji Małgorzata Chat, zgadzasz się na{' '}
            <a href="#" className="underline">
              funkcji użytkowania
            </a>
            . Zobacz nasze{' '}
            <a href="#" className="underline">
              Oświadczenie o ochronie prywatności
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}