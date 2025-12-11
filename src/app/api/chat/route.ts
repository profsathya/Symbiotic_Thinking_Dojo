import { NextRequest } from 'next/server';
import { getProvider } from '@/lib/llm';
import { composeSystemPrompt } from '@/lib/prompts';
import { ChatRequest } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { messages, config, activeConstruct, activePartners, activeModel, isGuidedPractice } = body;

    // Compose the system prompt from configuration
    const systemPrompt = composeSystemPrompt(config, activeConstruct, activePartners, { isGuidedPractice });

    // Get the LLM provider based on the active model from the client
    const provider = getProvider(activeModel);

    // Create a readable stream for the response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Convert messages to LLM format
          const llmMessages = messages.map(msg => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
          }));

          // Stream the response
          const generator = provider.streamChat({
            modelName: activeModel,
            messages: llmMessages,
            systemPrompt,
          });

          for await (const chunk of generator) {
            if (chunk.content) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: chunk.content })}\n\n`));
            }
            if (chunk.done) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
            }
          }
        } catch (error) {
          console.error('Stream error:', error);
          const errorMessage = error instanceof Error
            ? error.message
            : 'An unexpected error occurred';
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: errorMessage })}\n\n`)
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process chat request' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
