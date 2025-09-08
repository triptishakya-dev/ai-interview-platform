"use client";
import React, { useState, useEffect } from "react";
import Vapi from "@vapi-ai/web";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface InterviewData {
  role: string;
  interviewType: string;
  experienceLevel: string;
  techStack: string[];
  questionCount: number;
}

const Agent = () => {
  const router = useRouter();
  const [vapi, setVapi] = useState<Vapi | null>(null);
  const [isCalling, setIsCalling] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [lastMessage, setLastMessage] = useState("");

  // Store user and assistant final messages
  const [userResponses, setUserResponses] = useState<string[]>([]);
  const [assistantPrompts, setAssistantPrompts] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const vapiClient = new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY!);
      setVapi(vapiClient);
    }
  }, []);

  const assistantOptions = {
    name: "AI interview assistant",
    firstMessage:
      "Hey {{username}}! Let's prepare your interview. I'll ask you a few questions and generate a perfect interview just for you. Are you ready?",
    transcriber: {
      provider: "deepgram",
      model: "nova-2",
      language: "en-US",
    },
    voice: {
      provider: "playht",
      voiceId: "jennifer",
    },
    model: {
      provider: "openai",
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `
You are an AI interview assistant.  
Your task is to collect these **5 required details** from the user:

1. Role/Position (string)  
2. Interview Type (technical, behavioral, or mixed)  
3. Experience Level (beginner, intermediate, hard)  
4. Tech Stack (string[] – list of technologies)  
5. Question Count (number)  

---

### Exact Question Flow:
1. "What role would you like to train for?"
2. "Are you aiming for the technical, behavioral or mixed interview?"
3. "What is your experience level (beginner, intermediate, or hard)?"
4. "A list of technologies to cover during the job interview?"
5. "How many questions would you like me to prepare for you?"

---

### Rules:
- **You must always speak first** when the conversation starts and before every new question.  
- Ask **one question at a time** in the exact wording above.  
- Wait for the user’s response before moving on.  
- If unclear or incomplete, **politely ask again** until the answer is valid.  
- If the user does not start speaking within 1 second, the system should automatically repeat/speak the question for them.  
- After collecting all 5 answers, say:  
  "Perfect! Your interview has been generated. Thank you, and good luck 🚀"  
- Stop after that.  

Keep responses **short, friendly, and conversational**.  
        `,
        },
      ],
    },
  };

  const callGenerateAPI = async (
    userResponses: string[],
    assistantPrompts: string[]
  ) => {
    try {
      console.log("Calling /api/vapi/generate with fetch...");

      const response = await fetch("/api/vapi/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          userResponses: userResponses,
          assistantPrompts: assistantPrompts,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("✅ Generate API Response:", result);
      return result;
    } catch (error) {
      console.error("❌ Error calling generate API:", error);
      throw error;
    }
  };

  const startCall = () => {
    if (!vapi) return;
    vapi.start(assistantOptions);
    setIsConnected(true);
    setIsCalling(true);
  };

  const endCall = async () => {
    if (!vapi) return;
    vapi.stop();
    setIsCalling(false);

    console.log("=== CALL ENDED MANUALLY ===");
    console.log("User Responses:", userResponses);
    console.log("Assistant Prompts:", assistantPrompts);
    console.log("All Messages:", messages);

    // Call the generate API with the collected data using fetch
    if (userResponses.length > 0 || assistantPrompts.length > 0) {
      try {
        const apiResponse = await callGenerateAPI(
          userResponses,
          assistantPrompts
        );
        console.log("API call successful:", apiResponse);
      } catch (error) {
        console.error("Failed to call generate API:", error);
      }
    } else {
      console.log("No data to send to generate API");
    }
  };

  useEffect(() => {
    if (!vapi) return;

    const handleSpeechStart = () => setIsSpeaking(false);
    const handleSpeechEnd = () => setIsSpeaking(true);

    vapi.on("speech-start", () => {
      setIsConnected(false);
      setIsSpeaking(false);
    });
    vapi.on("speech-end", () => {
      setIsSpeaking(true);
    });
    vapi.on("call-start", () => {
      setIsCalling(true);
    });
    vapi.on("call-end", () => {
      setIsCalling(false);
      setLastMessage("");
      toast.success("Interview created successfully!");
      router.push("/");
    });
    vapi.on("message", (message) => {
      // Add message to messages array
      setMessages((prev) => [...prev, message]);

      if (message.type === "transcript" && message.transcriptType === "final") {
        // User's final transcript
        const userResponse = message.transcript;
        setLastMessage(`You: ${userResponse}`);

        // Add to userResponses array
        setUserResponses((prev) => [...prev, userResponse]);
      } else if (message.type === "function-call") {
        // Assistant's response
        setLastMessage(
          `Assistant: ${message.functionCall?.name || "Processing..."}`
        );
      } else if (message.type === "conversation-update") {
        // Get the last assistant message from conversation
        const lastAssistantMessage = message.conversation
          ?.filter((msg: any) => msg.role === "assistant")
          ?.pop();

        if (lastAssistantMessage) {
          const assistantResponse = lastAssistantMessage.content;
          setLastMessage(`Assistant: ${assistantResponse}`);

          // Add to assistantPrompts array (avoid duplicates)
          setAssistantPrompts((prev) => {
            if (!prev.includes(assistantResponse)) {
              return [...prev, assistantResponse];
            }
            return prev;
          });
        }
      }
    });
    return () => {
      vapi.off("speech-start", handleSpeechStart);
      vapi.off("speech-end", handleSpeechEnd);
      vapi.off("call-start", () => {});
      vapi.off("call-end", () => {});
      vapi.off("message", () => {});
    };
  }, [vapi]);

  return (
    <>
      <div className="call-view">
        <div className="card-interviewer">
          <div className="avatar">
            <Image
              src={"/ai-avatar.png"}
              alt="avatar"
              height={65}
              width={54}
              className="object-cover"
            />
            {!isSpeaking && <span className="animate-speak" />}
          </div>
          <h3>AI Interviewer</h3>
        </div>
        <div className="card-border">
          <div className="card-content relative flex justify-center items-center">
            {/* Ping Halo */}

            <Image
              src={"/user-avatar.png"}
              height={110}
              width={110}
              alt="user avatar"
              className="rounded-full object-cover relative z-10"
            />
            <span className=" " />
            <h3 className="mt-2 z-10">Nikhil</h3>
          </div>
        </div>
      </div>
      {messages.length > 0 && isCalling && (
        <div className="transcript-border">
          <div className="transcript">
            <p
              key={lastMessage}
              className={cn(
                "transition-opacity duration-500 opacity-0",
                "animate-fadeIn opacity-100"
              )}
            >
              {lastMessage}
            </p>
          </div>
        </div>
      )}

      <div className="flex gap-4 mt-4 justify-center ">
        <button
          onClick={!isConnected ? startCall : undefined}
          className="relative btn-call"
          disabled={isConnected}
        >
          {isConnected ? "Connecting..." : "Start Call"}
        </button>

        {isCalling && (
          <button onClick={endCall} className="btn-disconnect">
            End Call
          </button>
        )}
      </div>
    </>
  );
};

export default Agent;