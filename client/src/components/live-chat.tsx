import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X, Send, MessageCircle, User, Bot, Minimize2, Mail } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'support';
  timestamp: Date;
}

interface LiveChatProps {
  isOpen: boolean;
  onClose: () => void;
  onMinimize: () => void;
}

export function LiveChat({ isOpen, onClose, onMinimize }: LiveChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! Welcome to RentLedger support. I can help with general questions about our service. For complex technical issues, billing, or account-specific problems, please email support@rentledger.co.uk. How can I assist you today?',
      sender: 'support',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Simulate support response with escalation logic
    setTimeout(() => {
      const userQuery = inputText.toLowerCase();
      let supportResponse = "";
      
      // Check for complex queries that should be escalated
      const complexQueries = [
        'billing', 'payment', 'charge', 'subscription', 'cancel', 'refund',
        'technical', 'bug', 'error', 'not working', 'broken', 'issue',
        'account', 'delete', 'privacy', 'gdpr', 'data', 'security',
        'credit report', 'landlord verification', 'bank connection'
      ];
      
      const isComplexQuery = complexQueries.some(keyword => userQuery.includes(keyword));
      
      if (isComplexQuery) {
        supportResponse = `I understand you need help with this important matter. For complex technical issues, billing inquiries, account problems, or detailed credit reporting questions, I recommend emailing our customer service team at support@rentledger.co.uk. They have access to your account details and can provide specialized assistance. They typically respond within 24 hours.

Would you like me to help you with anything else I can assist with right now?`;
      } else {
        const generalResponses = [
          "Thank you for reaching out! I'm here to help with general questions about RentLedger.",
          "I'd be happy to help you with basic questions about our service.",
          "I can assist with general information about RentLedger. What would you like to know?",
          "Thanks for contacting us! I can help with basic questions about rent tracking and credit building.",
          "I'm here to help with general inquiries. For account-specific or technical issues, you may need to email support@rentledger.co.uk.",
        ];
        supportResponse = generalResponses[Math.floor(Math.random() * generalResponses.length)];
      }
      
      const supportMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: supportResponse,
        sender: 'support',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, supportMessage]);
      setIsTyping(false);
    }, 1500 + Math.random() * 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[500px] bg-white rounded-lg shadow-2xl border border-gray-200 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-blue-600 text-white rounded-t-lg">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <MessageCircle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold">Live Support</h3>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-xs">Online</span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={onMinimize} className="text-white hover:bg-white/20">
            <Minimize2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-white/20">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start space-x-2 max-w-[80%] ${
                message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  message.sender === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {message.sender === 'user' ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                </div>
                <div className={`p-3 rounded-lg ${
                  message.sender === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  <p className="text-sm">{message.text}</p>
                  <p className={`text-xs mt-1 ${
                    message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="flex items-start space-x-2">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 text-gray-600" />
                </div>
                <div className="bg-gray-100 p-3 rounded-lg">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex flex-col space-y-2">
          <div className="flex space-x-2">
            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1"
            />
            <Button onClick={sendMessage} size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-500">
              Connected as {(user as any)?.firstName || (user as any)?.email || 'Guest'}
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.location.href = 'mailto:support@rentledger.co.uk'}
              className="text-xs bg-gray-50 hover:bg-gray-100 border-gray-200"
            >
              <Mail className="w-3 h-3 mr-1" />
              Email Support
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Chat Toggle Button Component
interface ChatToggleProps {
  onClick: () => void;
  hasUnread?: boolean;
}

export function ChatToggle({ onClick, hasUnread = false }: ChatToggleProps) {
  return (
    <Button
      onClick={onClick}
      className="fixed bottom-4 right-4 w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg z-40"
      size="sm"
    >
      <MessageCircle className="w-6 h-6 text-white" />
      {hasUnread && (
        <Badge className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs p-0 flex items-center justify-center">
          !
        </Badge>
      )}
    </Button>
  );
}