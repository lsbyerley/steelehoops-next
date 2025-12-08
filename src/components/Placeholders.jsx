const Placeholders = ({ number }) => {
  const rows = [];
  for (let i = 0; i < number; i++) {
    rows.push(
      <div
        key={i}
        className="bg-base-100 h-28 w-full rounded-lg p-4 shadow-md ring-1 ring-slate-900/5"
      >
        <div className="flex animate-pulse space-x-4">
          <div className="bg-base-300 h-10 w-10 rounded-full"></div>
          <div className="flex-1 space-y-6 py-1">
            <div className="bg-base-300 h-2 rounded"></div>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-base-300 col-span-2 h-2 rounded"></div>
                <div className="bg-base-300 col-span-1 h-2 rounded"></div>
              </div>
              <div className="bg-base-300 h-2 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return rows;
};

export default Placeholders;
