'use client';

import { useEffect, useState } from 'react';
import { format, parse, isValid } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';

import { cn } from '../lib/utils';
import { Button } from '../components/ui/button';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';

const DatePicker = ({ gamesDate, fetchGames = () => {} }) => {
  const [date, setDate] = useState();

  useEffect(() => {
    if (gamesDate) {
      const parsedDate = parse(gamesDate, 'yyyyMMdd', new Date());
      if (parsedDate && isValid(parsedDate) && parsedDate !== date) {
        setDate(parsedDate);
      }
    }
  }, [gamesDate]);

  const handleSelectDate = (selectedDate) => {
    if (selectedDate && selectedDate !== date) {
      setDate(selectedDate);
      const formattedDate = format(selectedDate, 'yyyyMMdd');
      fetchGames(formattedDate);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={'outline'}
          className={cn(
            'w-[280px] justify-start text-left font-normal',
            !date && 'text-muted-foreground'
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, 'PPP') : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelectDate}
          disabled={{ before: new Date() }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
};

export default DatePicker;
