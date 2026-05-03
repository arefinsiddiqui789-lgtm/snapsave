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
            'You are a professional summarizer. Your job is to create concise summaries of notes. Extract the key points and present them in a clear, brief format. Use bullet points for multiple key points. Return ONLY the summary, no explanations or metadata.',
        },
        {
          role: 'user',
          content: `Summarize this note into key points:\n\n${content}`,
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
