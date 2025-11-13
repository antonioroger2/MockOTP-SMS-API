import {
  Briefcase,
  KeyRound,
} from 'lucide-react';
import type { JobRequestData, Message, OtpData } from '@/app/types';

const OtpContent = ({ data }: { data: OtpData }) => (
  <div className="flex flex-col">
    <div className="flex items-center gap-2.5 mb-2">
      <div className="bg-primary/10 p-2 rounded-full">
        <KeyRound className="w-5 h-5 text-primary" />
      </div>
      <p className="font-bold text-lg">One-Time Password</p>
    </div>
    <p className="text-muted-foreground mb-3">Your secure code is:</p>
    <p className="text-4xl font-bold font-mono tracking-widest text-primary self-center bg-primary/5 py-2 px-4 rounded-lg border border-primary/20">
      {data.code}
    </p>
    <p className="text-xs text-muted-foreground self-center mt-3">
      (Valid for {data.validity})
    </p>
  </div>
);

const JobRequestContent = ({ data }: { data: JobRequestData }) => (
  <div>
    <div className="flex items-center gap-2.5 mb-3">
      <div className="bg-primary/10 p-2 rounded-full">
        <Briefcase className="w-5 h-5 text-primary" />
      </div>
      <p className="font-bold text-lg">New Job Request</p>
    </div>
    <div className="space-y-1.5 text-sm">
      <div>
        <span className='font-semibold'>{data.role}</span> at <span className='font-semibold'>{data.locality}</span>
      </div>
      <div className="text-muted-foreground">
        {data.date} at {data.time}
      </div>
      <div className="text-muted-foreground">
        {data.hours} hours at ${data.rate}/hr
      </div>
      {data.description && (
        <div className="text-muted-foreground pt-1 text-xs italic">
          "{data.description}"
        </div>
      )}
    </div>
  </div>
);

export function MessageCard({ message }: { message: Message }) {
  return (
    <div>
      {message.type === 'otp' ? (
        <OtpContent data={message.data as OtpData} />
      ) : (
        <JobRequestContent data={message.data as JobRequestData} />
      )}
    </div>
  );
}
