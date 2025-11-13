'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { MessageCard } from '@/components/message-card';
import { type Message } from '@/app/types';
import { Search, Inbox, Smartphone, Signal, Wifi, Battery } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { format } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';

const FormSchema = z.object({
  phone: z.string().min(10, {
    message: 'Phone number must be at least 10 characters.',
  }),
});

export default function Dashboard() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchedPhone, setSearchedPhone] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const newOpacity = Math.max(0, 1 - scrollY / 150);
      setOpacity(newOpacity);
    };

    window.addEventListener('scroll', handleScroll);

    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearInterval(timer);
    };
  }, []);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      phone: '',
    },
  });

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    setIsLoading(true);
    setError(null);
    setSearchedPhone(data.phone);
    try {
      const response = await fetch(`/api/messages/${data.phone}`);
      if (!response.ok) {
        throw new Error('Failed to fetch messages.');
      }
      const fetchedMessages: Message[] = await response.json();
      // sort by timestamp ascending
      setMessages(fetchedMessages.sort((a, b) => a.timestamp - b.timestamp));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'An unknown error occurred.'
      );
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="container mx-auto p-4 md:p-8 flex flex-col items-center">
      <div 
        className="w-full max-w-sm mb-8 transition-opacity duration-300"
        style={{ opacity }}
      >
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex gap-2"
          >
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input
                      placeholder="+1 555 123 4567"
                      {...field}
                      autoComplete="tel"
                      className="h-14 text-lg text-center font-mono tracking-wider bg-background border-2 border-primary/20 focus:border-primary/50 focus:ring-primary/20"
                    />
                  </FormControl>
                  <FormMessage className="text-xs text-center" />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading} size="lg" className='h-14 w-14'>
              <Search className="h-6 w-6" />
              <span className="sr-only">Search</span>
            </Button>
          </form>
        </Form>
      </div>

      <div className="w-full max-w-sm bg-neutral-900 border-[14px] border-neutral-900 rounded-[60px] shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-8 bg-neutral-900 rounded-b-2xl flex justify-center items-center">
            <div className="w-16 h-2 bg-neutral-700 rounded-full"></div>
        </div>
        <div className="h-[740px] bg-background flex flex-col">
          <div className="p-3 flex items-center justify-between text-sm font-semibold">
              <div className='w-12'>{currentTime}</div>
              <div className="flex items-center gap-1.5 text-xs">
                <Signal size={16} />
                <Wifi size={16} />
                <Battery size={20} className='fill-foreground' />
              </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            <AnimatePresence>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex flex-col gap-2 w-3/4"
                >
                  <Skeleton className="h-16 rounded-2xl" />
                </motion.div>
              ))
            ) : error ? (
              <div className="text-center py-10">
                <p className="text-destructive">{error}</p>
              </div>
            ) : searchedPhone && messages.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground flex flex-col items-center gap-4 h-full justify-center">
                <Inbox className="w-16 h-16 opacity-50" />
                <h3 className="text-xl font-semibold">No Messages</h3>
                <p>This inbox is empty.</p>
              </div>
            ) : messages.length > 0 ? (
              messages.map((msg, index) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex flex-col gap-1"
                >
                  <div className="chat-bubble chat-bubble-received">
                    <MessageCard message={msg} />
                  </div>
                  <div className="text-xs text-muted-foreground self-start ml-3">
                    {format(new Date(msg.timestamp), 'p')}
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-10 text-muted-foreground flex flex-col items-center gap-4 h-full justify-center">
                <Smartphone className="w-16 h-16 opacity-50" />
                <h3 className="text-xl font-semibold">SMS Simulator</h3>
                <p>Enter a phone number to view messages.</p>
              </div>
            )}
            </AnimatePresence>
          </div>
          <div className="p-3 bg-secondary/30 border-t">
            <div className="bg-secondary rounded-full h-10 flex items-center px-4 text-sm text-muted-foreground">
              Messages
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
