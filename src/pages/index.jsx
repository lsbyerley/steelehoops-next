import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import axios from 'axios';
import { isValid, format, parse } from 'date-fns';
import Placeholders from '../components/Placeholders';
import GameModule from '../components/GameModule';
import Header from '../components/Header';

// const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;

const wait = (ms) => new Promise((res) => setTimeout(res, ms));

const Home = () => {
  const { query, isReady } = useRouter();
  const [gamesData, setGamesData] = useState(null);
  const [isLoading, setLoading] = useState(false);

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
        <Header gamesData={gamesData} gamesLoading={isLoading} />
        <div className='grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3'>
          {isLoading && <Placeholders number={9} />}
          {gamesData?.htGames
            ?.filter((g) => g.halftimeAction === 'yes-bet')
            .map((g) => {
              return (
                <div key={g.id} className='grid-item'>
                  <GameModule game={g} halftimeGame={true} halftimeBet={true} />
                </div>
              );
            })}
          {gamesData?.games?.map((g) => {
            return <GameModule key={g.id} game={g} />;
          })}
          {!isLoading &&
            !gamesData?.games?.length &&
            !gamesData?.htGames?.length && (
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
