import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/src/components/ui/table';
import { clsx } from 'clsx';
import { useMemo, useState } from 'react';

const SORT_KEYS = {
  wins: 'wins',
  rating: 'rating',
  confWins: 'confWins',
};

const parseSortValue = (value) => {
  const num = parseFloat(value);
  return Number.isNaN(num) ? -Infinity : num;
};

const sortTeams = (teams, sortKey, sortDir) => {
  return [...teams].sort((a, b) => {
    const aVal = parseSortValue(a[sortKey]);
    const bVal = parseSortValue(b[sortKey]);
    if (aVal < bVal) {
      return sortDir === 'asc' ? -1 : 1;
    }
    if (aVal > bVal) {
      return sortDir === 'asc' ? 1 : -1;
    }
    return 0;
  });
};

export const getServerSideProps = async (ctx) => {
  let teams;
  try {
    teams = await import(`../data/teampredictions.json`);
  } catch (err) {
    console.error('LOG: error importing teams json file');
  }

  const sorted = teams?.rankings;

  return {
    props: {
      teams: sorted || [],
    },
  };
};

const SortableHeader = ({ label, column, sortKey, sortDir, onSort }) => {
  const isActive = sortKey === column;

  return (
    <TableHead aria-sort={isActive ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button
        type="button"
        onClick={() => onSort(column)}
        className={clsx(
          'inline-flex cursor-pointer items-center gap-1',
          isActive ? 'text-foreground font-semibold' : 'hover:text-foreground/80'
        )}
      >
        {label}
        {isActive && <span aria-hidden="true">{sortDir === 'desc' ? '↓' : '↑'}</span>}
      </button>
    </TableHead>
  );
};

const CFBRankings = ({ teams }) => {
  const [sortKey, setSortKey] = useState(SORT_KEYS.wins);
  const [sortDir, setSortDir] = useState('desc');

  const sortedTeams = useMemo(
    () => sortTeams(teams, sortKey, sortDir),
    [teams, sortKey, sortDir]
  );

  const handleSort = (column) => {
    if (sortKey === column) {
      setSortDir((dir) => (dir === 'desc' ? 'asc' : 'desc'));
      return;
    }

    setSortKey(column);
    setSortDir('desc');
  };

  return (
    <div className="mx-auto max-w-5xl">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">Rk</TableHead>
            <SortableHeader
              label="Wins"
              column={SORT_KEYS.wins}
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={handleSort}
            />
            <TableHead>Team</TableHead>
            <SortableHeader
              label="Rating"
              column={SORT_KEYS.rating}
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={handleSort}
            />
            <SortableHeader
              label="Conf Wins"
              column={SORT_KEYS.confWins}
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={handleSort}
            />
            <TableHead>WinConf%</TableHead>
            <TableHead>Losses</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedTeams.map((t, index) => {
            return (
              <TableRow
                key={t.team}
                className={clsx(
                  t.taken &&
                    '[&>td]:bg-zinc-200 dark:[&>td]:bg-zinc-800 hover:[&>td]:bg-zinc-200 dark:hover:[&>td]:bg-zinc-800',
                  t.myTeam && 'text-red-600'
                )}
              >
                <TableCell className="font-medium">{index + 1}</TableCell>
                <TableCell className="font-medium">{t.wins}</TableCell>
                <TableCell>{t.team}</TableCell>
                <TableCell>{t.rating}</TableCell>
                <TableCell>{t.confWins}</TableCell>
                <TableCell>{t.winConf}</TableCell>
                <TableCell>{t.losses}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default CFBRankings;
