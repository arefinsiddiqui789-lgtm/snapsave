import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json();

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'assistant',
          content:
            'You are a friendly, clear-thinking person who explains things simply. When you summarize, write like you are telling a friend what the note says — use plain language, short sentences, and a natural conversational tone. No jargon, no formal bullet points, no robotic phrasing. Just a clear, easy-to-read summary that anyone can understand. Keep it short but make sure the main ideas come through. Return ONLY the summary text.',
        },
        {
          role: 'user',
          content: `Can you sum up what this note says in simple, easy-to-understand language?\n\n${content}`,
        },
      ],
      thinking: { type: 'disabled' },
    });

    const summary = completion.choices[0]?.message?.content;

    if (!summary) {
      return NextResponse.json({ error: 'Failed to summarize note' }, { status: 500 });
    }

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('AI Summarize error:', error);
    return NextResponse.json(
      { error: 'Failed to summarize note. Please try again.' },
      { status: 500 }
    );
  }
}
