import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import axios from 'axios';
import { isValid, format, parseISO, parse } from 'date-fns';
import Placeholders from '../components/Placeholders';
import GameModule from '../components/GameModule';

// const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;

const wait = (ms) => new Promise((res) => setTimeout(res, ms));

const Home = () => {
  const { query, isReady } = useRouter();
  const [gamesData, setGamesData] = useState(null);
  const [isLoading, setLoading] = useState(false);

  const gameDateShort = gamesData?.date
    ? format(parseISO(gamesData?.date || ''), 'MMM d, yyyy')
    : '-';
  const gameDateLong = gamesData?.date
    ? format(parseISO(gamesData.date), 'MMMM d, yyyy')
    : '-';
  const gameDateDay = gamesData?.date
    ? format(parseISO(gamesData?.date || ''), 'EEEE')
    : '-';

  const fetchGames = async (date) => {
    setLoading(false);
    try {
      setLoading(true);

      let gamesRes;
      if (date === 'usetest') {
        gamesRes = await import(`../data/games-test-res.json`);
      } else {
        gamesRes = await axios.get(`/api/games?date=${date}`);
      }

      await wait(1000);
      setGamesData(gamesRes?.data || {});

      setLoading(false);
    } catch (err) {
      setError(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isReady) {
      const queryDate = query?.date;
      const defaultDate = format(new Date(), 'yyyyMMdd');

      const gameDate =
        queryDate === 'usetest'
          ? queryDate
          : isValid(parse(queryDate, 'yyyyMMdd', new Date()))
          ? format(parse(queryDate, 'yyyyMMdd', new Date()), 'yyyyMMdd')
          : defaultDate;

      fetchGames(gameDate);
    }
  }, [isReady]);

  return (
    <>
      <Head>
        <title>SteeleHoops</title>
        <meta
          property='og:title'
          content='SteeleHoops - Beat The Bookie'
          key='title'
        />
      </Head>
      <div>
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
            <div className='font-bold'>SH</div>
            <div className='w-px h-6 ml-6 bg-gray-300'></div>
            <div className='ml-6'>toggle</div>
          </div>
        </header>
        <div className='grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3'>
          {isLoading && <Placeholders number={9} />}
          {gamesData?.games?.map((g) => {
            return <GameModule key={g.id} game={g} />;
          })}
          {!isLoading && !gamesData?.games && (
            <div>
              <p className='mt-1 text-sm'>No games :(</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Home;
