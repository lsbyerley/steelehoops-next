const Placeholders = ({ number }) => {
  const rows = [];
  for (let i = 0; i < number; i++) {
    rows.push(
      <div
        key={i}
        className='w-full p-4 bg-white rounded-lg shadow-md h-28 ring-1 ring-slate-900/5 dark:bg-slate-800'
      >
        <div className='flex space-x-4 animate-pulse'>
          <div className='w-10 h-10 rounded-full bg-slate-200'></div>
          <div className='flex-1 py-1 space-y-6'>
            <div className='h-2 rounded bg-slate-200'></div>
            <div className='space-y-3'>
              <div className='grid grid-cols-3 gap-4'>
                <div className='h-2 col-span-2 rounded bg-slate-200'></div>
                <div className='h-2 col-span-1 rounded bg-slate-200'></div>
              </div>
              <div className='h-2 rounded bg-slate-200'></div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return rows;
};

export default Placeholders;
