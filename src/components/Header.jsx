import { formatInTimeZone } from 'date-fns-tz';
import { parseISO } from 'date-fns';
import { ArrowPathIcon } from '@heroicons/react/20/solid';
import clsx from 'clsx';

const Header = ({ gamesData, gamesDate, gamesLoading = false, fetchGames }) => {
  const gameDateShort = gamesData?.date
    ? formatInTimeZone(
        parseISO(gamesData?.date || ''),
        'America/New_York',
        'MMM d, yyyy'
      )
    : '-';
  const gameDateLong = gamesData?.date
    ? formatInTimeZone(
        parseISO(gamesData.date),
        'America/New_York',
        'MMMM d, yyyy'
      )
    : '-';
  const gameDateDay = gamesData?.date
    ? formatInTimeZone(
        parseISO(gamesData?.date || ''),
        'America/New_York',
        'EEEE'
      )
    : '-';

  const refreshGames = () => {
    fetchGames(gamesDate);
  };

  return (
    <header className='flex items-center justify-between flex-none px-6 py-4 border-b shadow-md'>
      <div>
        <h1 className='text-lg font-semibold leading-6'>
          <time dateTime={gameDateShort} className='sm:hidden'>
            {gameDateShort}
          </time>
          <time dateTime={gameDateLong} className='hidden sm:inline'>
            {gameDateLong}
          </time>
        </h1>
        <p className='mt-1 text-sm'>{gameDateDay}</p>
      </div>
      <div className='flex items-center'>
        <div className=''>
          <button
            className='btn btn-circle btn-outline btn-sm'
            onClick={refreshGames}
          >
            <ArrowPathIcon
              className={clsx('h-5', gamesLoading ? 'animate-spin' : '')}
            />
          </button>
        </div>
        <div className='w-px h-6 ml-6 bg-gray-300'></div>
        <div className='ml-6 font-bold'>SH</div>
      </div>
    </header>
  );
};

export default Header;
