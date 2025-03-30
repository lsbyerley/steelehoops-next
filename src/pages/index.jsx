import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import axios from 'axios';
import { isValid, format, parse } from 'date-fns';
import Placeholders from '../components/Placeholders';
import GameModule from '../components/GameModule';
import Header from '../components/Header';

const defaultDate = format(new Date(), 'yyyyMMdd');

const wait = (ms) => new Promise((res) => setTimeout(res, ms));

const Home = () => {
  const { query, isReady } = useRouter();
  const [gamesData, setGamesData] = useState(null);
  const [gamesDate, setGamesDate] = useState();
  const [isLoading, setLoading] = useState(false);
  const hasHtGames = gamesData?.htGames?.filter((g) => g.halftimeAction === 'yes-bet')?.length > 0;

  const fetchGames = async (date) => {
    try {
      setLoading(true);

      let gamesRes;
      if (date === 'usetest') {
        gamesRes = await import(`../data/games-test-res.json`);
      } else {
        let gamesUrl = date ? `/api/games?date=${date}` : '/api/games';
        gamesRes = await axios.get(gamesUrl);
      }

      await wait(1000);
      setGamesData(gamesRes?.data || {});

      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isReady) {
      let gamesDate = defaultDate;
      const queryDate = query?.date;
      if (queryDate === 'usetest') gamesDate = queryDate;
      if (queryDate && isValid(parse(queryDate, 'yyyyMMdd', new Date()))) {
        gamesDate = format(parse(queryDate, 'yyyyMMdd', new Date()), 'yyyyMMdd')
      }

      setGamesDate(gamesDate);
      fetchGames(gamesDate);
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
        <Header gamesData={gamesData} gamesDate={gamesDate} gamesLoading={isLoading} fetchGames={fetchGames} />
        <div className='grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3'>
          {isLoading && <Placeholders number={9} />}
          {!isLoading && gamesData?.htGames
            ?.filter((g) => g.halftimeAction === 'yes-bet')
            .map((g) => {
              return (
                <div key={g.id} className='grid-item'>
                  <GameModule game={g} halftimeGame={true} halftimeBet={true} />
                </div>
              );
            })}
          {!isLoading && gamesData?.games?.map((g) => {
            return <GameModule key={g.id} game={g} />;
          })}
          {!isLoading &&
            !gamesData?.games?.length &&
            !hasHtGames && (
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
