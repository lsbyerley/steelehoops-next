import { clsx } from "clsx";

export const getServerSideProps = async (ctx) => {
  let teams;
  try {
    teams = await import(`../data/teamrankings.json`);
  } catch (err) {
    console.error('LOG: error importing teams json file');
  }

  return {
    props: {
      teams: teams?.rankings || [],
    },
  };
};

const CFBRankings = ({ teams }) => {
  return (
    <div className='overflow-x-auto max-w-5xl mx-auto'>
      <table className='table table-sm'>
        <thead>
          <tr>
            <th>Wins</th>
            <th>Team</th>
            <th>Rating</th>
            <th>WinConf%</th>
            <th>Losses</th>
          </tr>
        </thead>
        <tbody>
          {teams.map((t) => {
            return (
              <tr key={t.team} className={clsx(t.taken ? 'bg-base-300' : '', t.myTeam ? 'text-red-600' : '')}>
                <th>{t.wins}</th>
                <td>{t.team}</td>
                <td>{t.rating}</td>
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
