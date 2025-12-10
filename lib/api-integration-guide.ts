// Guide for integrating your AI model API
// Follow these steps to connect your car plate recognition AI model

export const API_INTEGRATION_GUIDE = `
// STEP 1: Update the detectPlate function in lib/api.ts
// Replace the mock implementation with your actual API endpoint

// Example with popular AI services:

// ============================================
// OPTION 1: Using Vercel AI SDK (Recommended)
// ============================================
import { generateText } from 'ai';

export async function detectPlateWithAI(imageUrl: string) {
  const { text } = await generateText({
    model: 'openai/gpt-4-vision', // or your preferred vision model
    prompt: 'Analyze this car plate image and extract the plate number. Response format: {"plateNumber": "ABC123", "confidence": 0.95}',
    messages: [{
      role: 'user',
      content: [{
        type: 'image',
        image: imageUrl,
      }],
    }],
  });
  
  return JSON.parse(text);
}

// ============================================
// OPTION 2: Custom REST API
// ============================================
export async function detectPlate(imageUrl: string) {
  const response = await fetch(process.env.NEXT_PUBLIC_AI_MODEL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': \`Bearer \${process.env.AI_MODEL_API_KEY}\`,
    },
    body: JSON.stringify({
      image: imageUrl,
      model: 'plate-recognition-v1',
    }),
  });

  if (!response.ok) {
    throw new Error('Plate detection failed');
  }

  const result = await response.json();
  
  return {
    id: Date.now().toString(),
    plateNumber: result.plate_number,
    timestamp: new Date().toISOString(),
    imageUrl: imageUrl,
    confidence: result.confidence,
  };
}

// ============================================
// OPTION 3: Server Action Integration
// ============================================
'use server'

export async function detectPlateServerAction(imageData: string) {
  const response = await fetch(process.env.AI_MODEL_ENDPOINT!, {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${process.env.AI_MODEL_API_KEY}\`,
    },
    body: imageData,
  });

  return response.json();
}

// ============================================
// REQUIRED ENVIRONMENT VARIABLES
// ============================================
// Add these to your Vercel project settings:
// - NEXT_PUBLIC_AI_MODEL_ENDPOINT: Your AI model API endpoint
// - AI_MODEL_API_KEY: Your API key for authentication
// - DATABASE_URL: For storing plate records (when ready)
`
