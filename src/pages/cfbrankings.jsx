import { clsx } from "clsx";

export const getServerSideProps = async (ctx) => {
  let teams;
  try {
    teams = await import(`../data/teamrankings.json`);
  } catch (err) {
    console.error('LOG: error importing teams json file');
  }

  const sorted = teams?.rankings;
  /* const sorted = teams?.rankings.sort((a, b) => {
    let aRating = parseFloat(a.rating);
    let bRating = parseFloat(b.rating);
    if (aRating < bRating) {
      return 1;
    } else if (aRating > bRating) {
      return -1;
    }
    // a must be equal to b
    return 0;
  }); */

  return {
    props: {
      teams: sorted || [],
    },
  };
};

const CFBRankings = ({ teams }) => {
  return (
    <div className='overflow-x-auto max-w-5xl mx-auto'>
      <table className='table table-sm'>
        <thead>
          <tr>
            <th>Rk</th>
            <th>Wins</th>
            <th>Team</th>
            <th>Rating</th>
            <th>Conf Wins</th>
            <th>WinConf%</th>
            <th>Losses</th>
          </tr>
        </thead>
        <tbody>
          {teams.map((t, index) => {
            return (
              <tr key={t.team} className={clsx(t.taken ? 'bg-base-300' : '', t.myTeam ? 'text-red-600' : '')}>
                <th>{index + 1}</th>
                <th>{t.wins}</th>
                <td>{t.team}</td>
                <td>{t.rating}</td>
                <td>{t.confWins}</td>
                <td>{t.winConf}</td>
                <td>{t.losses}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default CFBRankings;
