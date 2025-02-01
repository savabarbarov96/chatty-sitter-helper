import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Send, Upload, Loader2, LayoutDashboard } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{content: string, isAssistant: boolean}>>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const sendSound = new Audio('/send.mp3');
  const receiveSound = new Audio('/receive.mp3');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim()) return;

    try {
      sendSound.play();
      setMessages(prev => [...prev, { content: message, isAssistant: false }]);
      setMessage('');
      setIsLoading(true);

      // TODO: Integrate with n8n webhook
      setTimeout(() => {
        receiveSound.play();
        setMessages(prev => [...prev, { 
          content: "I'm your baby sitter assistant! How can I help you today?", 
          isAssistant: true 
        }]);
        setIsLoading(false);
      }, 2000);

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  const handleUpload = () => {
    toast({
      title: "Coming Soon",
      description: "Document upload feature will be available soon!",
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background p-4">
      {/* Main buttons */}
      <div className="flex justify-center gap-4 mb-6">
        <Button 
          variant="outline" 
          className="w-32 h-12 text-lg font-semibold hover:scale-105 transition-transform"
          onClick={() => document.getElementById('messageInput')?.focus()}
        >
          Chat
        </Button>
        <Button 
          variant="outline" 
          className="w-32 h-12 text-lg font-semibold hover:scale-105 transition-transform"
          onClick={handleUpload}
        >
          <Upload className="mr-2 h-4 w-4" /> Upload
        </Button>
        <Button
          variant="outline"
          className="w-32 h-12 text-lg font-semibold hover:scale-105 transition-transform"
          onClick={() => navigate('/dashboard')}
        >
          <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
        </Button>
      </div>

      {/* Chat area */}
      <Card className="flex-grow mb-4 p-4 overflow-y-auto max-h-[60vh] bg-card/50 backdrop-blur-sm">
        <div className="space-y-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.isAssistant ? 'justify-start' : 'justify-end'} message-animation`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  msg.isAssistant
                    ? 'bg-secondary text-secondary-foreground'
                    : 'bg-primary text-primary-foreground'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start message-animation">
              <div className="bg-secondary text-secondary-foreground max-w-[80%] p-3 rounded-lg">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </Card>

      {/* Input area */}
      <div className="flex gap-2">
        <Input
          id="messageInput"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type your message..."
          className="flex-grow bg-card/50 backdrop-blur-sm"
        />
        <Button 
          onClick={handleSend}
          disabled={isLoading || !message.trim()}
          className="hover:scale-105 transition-transform"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
};

export default Index;