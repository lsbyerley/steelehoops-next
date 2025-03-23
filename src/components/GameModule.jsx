import clsx from 'clsx';

const shLine = (game) => {
  let aline = game.prediction?.awayLine || '-';
  let hline = game.prediction?.homeLine || '-';

  if (aline === 0 && hline === 0) {
    return 'even';
  } else {
    if (aline > 0) {
      return `${game.away.abbrev} ${hline}`;
    } else {
      return `${game.home.abbrev} ${aline}`;
    }
  }
};

const HalftimeTip = ({ game }) => {
  const htBet = `Surplus Threes: ${game[game.surplusTeam].abbrev}: ${
    game.surplusThreeDiff
  }`;
  return (
    <div className='block gap-2 mx-auto mt-2 badge badge-accent badge-outline badge-md'>
      {htBet}
    </div>
  );
};

const GameModule = ({ game, halftimeGame = false, halftimeBet = false }) => {
  const gameLink = `https://www.espn.com/mens-college-basketball/game/_/gameId/${game.id}`;

  return (
    <div
      key={game.id}
      className={clsx(
        'w-full p-4 rounded-lg bg-base-100',
        game.totalDiff >= 5 || game.lineDiff >= 3 || halftimeBet
          ? 'shadow-md ring-2 ring-accent/50'
          : 'shadow-md ring-1 ring-base-content/5'
      )}
    >
      <header className='flex items-center justify-between flex-none mb-2'>
        <div className='text-xs flex items-center'>
          <a
            className='link link-neutral mr-1'
            href={gameLink}
            target='_blank'
            rel='noreferrer'
          >
            Gamecast
          </a>
          <p>(KP Diff: {game.kpDiff})</p>
        </div>
        <div className='text-xs'>
          {!halftimeGame && <span>{game.startTime} EST</span>}
          {halftimeGame && halftimeBet && <span>Halftime</span>}
        </div>
      </header>
      <div className='flex items-center justify-between'>
        <p className='font-medium truncate'>
          <span className='mr-1 text-sm'>({game.away.kenPom?.rank})</span>
          <span>{game.away.shortName}</span>
        </p>
        <p
          className={clsx('', halftimeGame && halftimeBet ? 'block' : 'hidden')}
        >
          {game.away.score}
        </p>
      </div>
      <div className='flex items-center justify-between'>
        <p className='font-medium truncate'>
          <span className='mr-1 text-sm'>({game.home.kenPom?.rank})</span>
          <span>{game.home.shortName}</span>
        </p>
        <p
          className={clsx('', halftimeGame && halftimeBet ? 'block' : 'hidden')}
        >
          {game.home.score}
        </p>
      </div>
      {halftimeGame && halftimeBet && <HalftimeTip game={game} />}
      {!halftimeGame && (
        <table className='table w-full mt-2 table-compact'>
          <thead>
            <tr>
              <th>VTotal</th>
              <th>SHTotal</th>
              <th>VLine</th>
              <th>SHLine</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{game.odds.vegasTotal}</td>
              <td
                className={clsx(
                  'relative',
                  game.totalDiff >= 5 ? 'text-accent font-bold' : ''
                )}
              >
                {game.prediction?.total}
              </td>
              <td>{game.odds?.vegasLine}</td>
              <td
                className={clsx(
                  'relative',
                  game.lineDiff >= 5 ? 'text-accent font-bold' : ''
                )}
              >
                {shLine(game)}
              </td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  );
};

export default GameModule;
