
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const checkBalanceTool: FunctionDeclaration = {
  name: 'check_wallet_balance',
  description: 'ব্যবহারকারীর বর্তমান ওয়ালেট ব্যালেন্স চেক করার জন্য এই ফাংশনটি ব্যবহার করুন।',
  parameters: {
    type: Type.OBJECT,
    properties: {},
  },
};

const listOrdersTool: FunctionDeclaration = {
  name: 'get_recent_orders',
  description: 'ব্যবহারকারীর সাম্প্রতিক করা অর্ডারগুলোর তালিকা দেখার জন্য এই ফাংশনটি ব্যবহার করুন।',
  parameters: {
    type: Type.OBJECT,
    properties: {
      limit: {
        type: Type.NUMBER,
        description: 'অর্ডারের সংখ্যা (ডিফল্ট ৫)',
      }
    },
  },
};

const navigateTool: FunctionDeclaration = {
  name: 'navigate_to_page',
  description: 'ব্যবহারকারীকে ওয়েবসাইটের নির্দিষ্ট কোনো পাতায় (যেমন: হোম, ওয়ালেট, অর্ডার, প্রোফাইল) নিয়ে যাওয়ার জন্য এই ফাংশনটি ব্যবহার করুন।',
  parameters: {
    type: Type.OBJECT,
    properties: {
      page: {
        type: Type.STRING,
        description: 'পাতার নাম। অপশন: home, wallet, orders, profile, add-money',
      }
    },
    required: ['page'],
  },
};

export const getSupportResponse = async (userMessage: string, history: any[] = []) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        ...history,
        { role: 'user', parts: [{ text: userMessage }] }
      ],
      config: {
        systemInstruction: `আপনি Vercel Topup BD এর একজন অত্যন্ত দক্ষ এবং বন্ধুত্বপূর্ণ সাপোর্ট এজেন্ট। 
        আপনার কাজ হলো ব্যবহারকারীদের গেম টপ-আপ, পেমেন্ট এবং ওয়ালেট সংক্রান্ত তথ্য দিয়ে সাহায্য করা।
        
        প্রধান নিয়মাবলী:
        ১. সর্বদা বাংলা ভাষায় উত্তর দিন। খুব প্রয়োজন না হলে ইংরেজি ব্যবহার করবেন না।
        ২. উত্তরগুলো সংক্ষিপ্ত এবং প্রাসঙ্গিক রাখুন।
        ৩. ব্যবহারকারী যদি তার ব্যালেন্স বা অর্ডার সম্পর্কে জানতে চায়, তবে ফাংশন কল (tools) ব্যবহার করুন।
        ৪. কোনো পাতা যেমন 'অর্ডার' বা 'ওয়ালেট' এ যেতে চাইলে navigate_to_page ফাংশন ব্যবহার করুন।
        ৫. আমাদের সাইটে ফ্রি ফায়ার, পাবজি সহ জনপ্রিয় গেমের টপ-আপ পাওয়া যায় সবচেয়ে সাশ্রয়ী মূল্যে।
        ৬. কাজের সময়: সকাল ৯টা থেকে রাত ১১টা।`,
        tools: [{
          functionDeclarations: [checkBalanceTool, listOrdersTool, navigateTool]
        }],
        thinkingConfig: { thinkingBudget: 0 }
      },
    });

    return response;
  } catch (error) {
    console.error("Gemini support error:", error);
    return null;
  }
};

export const sendFunctionResponse = async (history: any[], functionName: string, callId: string, responseData: any) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        ...history,
        {
          role: 'model',
          parts: [{
            functionResponse: {
              name: functionName,
              id: callId,
              response: responseData
            }
          }]
        }
      ],
      config: {
        systemInstruction: "আপনার কাছে এখন প্রয়োজনীয় তথ্য আছে। ব্যবহারকারীকে সুন্দর করে বাংলায় উত্তর দিন।",
      }
    });
    return response;
  } catch (error) {
    console.error("Gemini function callback error:", error);
    return null;
  }
};
