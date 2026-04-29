import { useState, useRef, useEffect } from "react";
import { Message } from "../types";
import gsap from "gsap";

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "¡Hola! Soy Michito. ¿En qué puedo ayudarte hoy? miau~" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const shouldStickToBottomRef = useRef(false);

  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return;

    const updateStickiness = () => {
      const distanceFromBottom =
        scroller.scrollHeight - (scroller.scrollTop + scroller.clientHeight);
      shouldStickToBottomRef.current = distanceFromBottom < 120;
    };

    updateStickiness();
    scroller.addEventListener("scroll", updateStickiness, { passive: true });
    return () => {
      scroller.removeEventListener("scroll", updateStickiness);
    };
  }, []);

  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return;
    if (!shouldStickToBottomRef.current) return;
    scroller.scrollTop = scroller.scrollHeight;
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { role: "user", content: input };
    shouldStickToBottomRef.current = true;
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMsg] })
      });
      
      const data = await res.json();
      
      if (data.content) {
        const assistantMsg: Message = { role: "assistant", content: data.content };
        setMessages(prev => [...prev, assistantMsg]);
        
        // Animación GSAP para el nuevo mensaje
        setTimeout(() => {
          if (chatContainerRef.current) {
            const lastMsg = chatContainerRef.current.lastElementChild;
            if (lastMsg) {
              gsap.fromTo(lastMsg, 
                { y: 30, opacity: 0, scale: 0.95 },
                { y: 0, opacity: 1, scale: 1, duration: 0.6, ease: "back.out(1.5)" }
              );
            }
          }
        }, 10);
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: "assistant", content: "Lo siento, tuve un problema con mi bola de lana (error de conexión)." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    messages,
    input,
    setInput,
    isLoading,
    handleSend,
    scrollRef,
    chatContainerRef
  };
}
