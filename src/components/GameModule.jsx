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

const GameModule = ({ game }) => {
  return (
    <div
      key={game.id}
      className='w-full p-4 bg-white rounded-lg shadow-md ring-1 ring-slate-900/5 dark:bg-slate-800'
    >
      <header className='flex items-center justify-between flex-none'>
        <div></div>
        <div className='text-xs'>{game.startTime}</div>
      </header>
      <div>
        <p className='font-medium truncate'>
          <span>{game.away.shortName}</span>
          <span className='ml-2 text-sm'>({game.away.kenPom?.rank})</span>
        </p>
      </div>
      <div>
        <p className='font-medium truncate'>
          <span>{game.home.shortName}</span>
          <span className='ml-2 text-sm'>({game.home.kenPom?.rank})</span>
        </p>
      </div>
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
                game.totalDiff >= 3 ? 'text-green-600 font-bold' : ''
              )}
            >
              {game.prediction?.total}
            </td>
            <td>{game.odds?.vegasLine}</td>
            <td
              className={clsx(
                'relative',
                game.lineDiff >= 3 ? 'text-green-600 font-bold' : ''
              )}
            >
              {shLine(game)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default GameModule;
