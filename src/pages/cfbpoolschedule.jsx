import React, { useEffect, useState } from 'react';
import WeeklyGrid from '../components/WeeklyGrid';

const API_SCHEDULE_URL = '/api/cfbschedule';
const API_POLLS_URL = '/api/cfbpolls';

const teamData = [
  { name: "Michigan", sitWeek: 2 },
  { name: "Arizona State", isFranchise: true },
  { name: "South Carolina", sitWeek: 12 },
  { name: "Georgia Tech", sitWeek: 14 },
  { name: "Oregon State", sitWeek: 4 },
  { name: "Pittsburgh", sitWeek: 7 },
  { name: "Vanderbilt", sitWeek: 6 },
  { name: "Southern Miss", sitWeek: null }
];

// For backwards compatibility with the rest of the code:
const teams = teamData.map(t => t.name);
const sitPlan = teamData.reduce((acc, t) => {
  if (t.isFranchise) return acc;
  return ({ ...acc, [t.name]: t.sitWeek });
}, {});
const franchiseTeam = teamData.find(t => t.isFranchise)?.name || null;

const CfbPoolSchedule = () => {
  const [games, setGames] = useState([]);
  const [polls, setPolls] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {

        const reqBody = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            teams,
          }),
        };

        const [gamesRes, pollsRes] = await Promise.all([
          fetch(API_SCHEDULE_URL, reqBody),
          fetch(API_POLLS_URL),
        ]);

        if (!gamesRes.ok) throw new Error('Failed to fetch schedule');
        if (!pollsRes.ok) throw new Error('Failed to fetch polls');

        const gamesData = await gamesRes.json();
        const pollsData = await pollsRes.json();

        setGames(gamesData);
        setPolls(pollsData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>Loading schedule...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="p-4">
      <WeeklyGrid 
        schedule={games} 
        sitPlan={sitPlan}
        polls={polls} 
        franchiseTeam={franchiseTeam}
      />
    </div>
  );
};

export default CfbPoolSchedule;
