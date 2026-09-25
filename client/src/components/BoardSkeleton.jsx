const COLUMNS = ["Backlog", "In Progress", "Review", "Done"];
const CARD_COUNTS = [3, 2, 1, 2]; // varied so it doesn't look like a rigid grid

export default function BoardSkeleton() {
  return (
    <div className="flex gap-4 overflow-x-auto p-6">
      {COLUMNS.map((col, colIndex) => (
        <div key={col} className="tf-column flex w-72 shrink-0 flex-col">
          <div className="tf-column-header flex items-center justify-between px-3 py-2.5">
            <span className="tf-skeleton h-3 w-20 rounded" />
            <span className="tf-skeleton h-3 w-5 rounded" />
          </div>
          <div className="flex-1 space-y-2 p-2.5">
            {Array.from({ length: CARD_COUNTS[colIndex] }).map((_, i) => (
              <div key={i} className="tf-card p-3">
                <div className="tf-skeleton h-4 w-3/4 rounded mb-2" />
                <div className="tf-skeleton h-3 w-full rounded mb-1" />
                <div className="tf-skeleton h-3 w-2/3 rounded mb-3" />
                <div className="flex items-center justify-between">
                  <span className="tf-skeleton h-4 w-14 rounded-full" />
                  <span className="tf-skeleton h-3 w-10 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
