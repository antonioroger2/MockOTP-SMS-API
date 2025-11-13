export type OtpData = {
  code: string;
  validity: string;
};

export type JobRequestData = {
  role: string;
  locality: string;
  date: string;
  time: string;
  hours: number;
  rate: number;
  description: string;
};

export type Message = {
  id: string;
  text: string;
  type: 'otp' | 'job_request';
  timestamp: number;
  data: OtpData | JobRequestData;
};

export type MessageDocument = {
  messages: Message[];
};
