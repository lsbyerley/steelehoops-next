import React from 'react';
import {
  cn,
  calculateGamePoints,
  calculateSeasonPoints,
  getNormalizedWeek,
  getTeamRank,
} from '../lib/utils';

const WeeklyGrid = ({ schedule, sitPlan, polls, franchiseTeam }) => {
  // normalize weeks across all teams
  const regularWeeks = Array.from({ length: 16 }, (_, i) => i + 1);
  // Find the max number of postseason games any team has played
  const maxPostWeeks = Math.max(
    ...schedule.data.map(
      (teamData) =>
        teamData.games.filter((g) => g.seasonType === 'postseason').length
    ),
    0
  );

  const leagueTotalPoints = schedule.data.reduce(
    (sum, teamData) =>
      sum + calculateSeasonPoints(teamData, sitPlan, polls, franchiseTeam),
    0
  );

  return (
    <div className='overflow-x-auto'>
      <table className='table-auto w-full border-collapse'>
        <thead>
          <tr>
            <th className='border p-2'>
              Week
              <div className='text-xs text-gray-500'>
                {leagueTotalPoints} pts
              </div>
            </th>
            {schedule.data.map((teamData) => (
              <th key={teamData.team} className='border p-2'>
                <div className='flex items-center justify-center'>
                  {teamData.team}
                  {franchiseTeam === teamData.team && (
                    <div className='text-xs text-yellow-600 ml-1 font-bold'>(F)</div>
                  )}
                </div>
                <div className='text-xs text-gray-500'>
                  Total:{' '}
                  {calculateSeasonPoints(
                    teamData,
                    sitPlan,
                    polls,
                    franchiseTeam
                  )}{' '}
                  pts
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* Regular Season */}
          {regularWeeks.map((week) => {
            const weekLabel = week === 15 ? `Champ Week` : `Week ${week}`;
            return renderRow(
              weekLabel,
              schedule,
              week,
              polls,
              sitPlan,
              franchiseTeam,
              false
            );
          })}

          {/* Postseason */}
          {Array.from({ length: maxPostWeeks }, (_, i) => {
            const weekLabel = i === 0 ? `Bowls or CFP` : `CFP`;
            return renderRow(
              weekLabel,
              schedule,
              i + 1,
              polls,
              sitPlan,
              franchiseTeam,
              true
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const renderRow = (
  weekLabel,
  schedule,
  weekIndex,
  polls,
  sitPlan,
  franchiseTeam,
  isPostseason = false
) => (
  <tr key={weekLabel}>
    <td className='border p-2 font-bold'>{weekLabel}</td>
    {schedule.data.map((teamData) => {
      // pick the game for this team in this slot
      let game;
      if (!isPostseason) {
        game = teamData.games.find(
          (g) => g.seasonType === 'regular' && g.week === weekIndex
        );
      } else {
        const postseasonGames = teamData.games.filter(
          (g) => g.seasonType === 'postseason'
        );
        game = postseasonGames[weekIndex - 1] || null; // 0-based index
      }

      if (!game) {
        return (
          <td key={teamData.team} className='border p-2 text-gray-400'>
            --
          </td>
        );
      }

      const isHome = game.homeTeam === teamData.team;
      const teamPoints = isHome ? game.homePoints : game.awayPoints;
      const oppPoints = isHome ? game.awayPoints : game.homePoints;
      const opponent = isHome ? game.awayTeam : game.homeTeam;
      const opponentRank = getTeamRank(opponent, game, polls);
      const isSitWeek = sitPlan[teamData.team] === weekIndex;

      let outcome = '';
      let tdClass = 'text-gray-700';
      if (game.completed) {
        if (teamPoints > oppPoints) {
          outcome = 'W';
          tdClass = 'bg-green-100 text-green-700 font-bold';
        } else if (teamPoints < oppPoints) {
          outcome = 'L';
          tdClass = 'bg-red-100 text-red-700 font-bold';
        }

        // Override colors if this is a sit week
        if (isSitWeek) {
          if (teamPoints > oppPoints) {
            // sat team WON → bad sit → RED
            tdClass = 'bg-red-100 text-red-700 font-bold';
          } else if (teamPoints < oppPoints) {
            // sat team LOST → good sit → GREEN
            tdClass = 'bg-green-100 text-green-700 font-bold';
          }
        }
      }

      const points = calculateGamePoints(
        game,
        teamData.team,
        getNormalizedWeek(game),
        sitPlan,
        polls,
        franchiseTeam
      );

      return (
        <td
          key={teamData.team}
          className={cn('border p-2 align-top relative', tdClass)}
        >
          <div className='flex items-center'>
            {!isHome && <div className='mr-1'>@</div>}
            {opponentRank && (
              <div className='mr-1 text-xs'>({opponentRank})</div>
            )}
            <div>{opponent}</div>
          </div>
          {game.completed && (
            <div className='flex'>
              <div className='mr-2'>{outcome}</div>
              <div>{game.completed ? `${teamPoints}-${oppPoints}` : ''}</div>
            </div>
          )}
          {isSitWeek && teamData.team !== franchiseTeam && (
            <div className='text-xs text-blue-600 italic absolute top-1 right-1'>
              Sit
            </div>
          )}
          {game.completed && (
            <div className='text-sm font-semibold'>{points} pts</div>
          )}
        </td>
      );
    })}
  </tr>
);

export default WeeklyGrid;
