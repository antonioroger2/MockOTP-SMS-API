import type { Message } from '@/app/types';

export function MessageCard({ message }: { message: Message }) {
  return (
    <div className="flex flex-col space-y-1">
      <div className="text-sm md:text-base font-medium leading-relaxed text-foreground/90 break-words whitespace-pre-wrap">
        {message.text}
      </div>
    </div>
  );
}
