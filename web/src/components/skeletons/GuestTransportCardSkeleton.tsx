export default function GuestTransportCardSkeleton() {
  return (
    <div className="transportCard animate-pulse">
      {/* Header */}
      <div className="guestHeader">
        <div className="space-y-2">
          <div className="h-5 w-48 bg-gray-300 rounded" />
          <div className="flex gap-4">
            <div className="h-3 w-24 bg-gray-200 rounded" />
            <div className="h-3 w-16 bg-gray-200 rounded" />
            <div className="h-3 w-20 bg-gray-200 rounded" />
          </div>
        </div>
      </div>

      {/* Driver section */}
      <div className="infoSection space-y-2">
        <div className="h-4 w-20 bg-gray-300 rounded" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-3 bg-gray-200 rounded" />
          <div className="h-3 bg-gray-200 rounded" />
          <div className="h-3 bg-gray-200 rounded" />
          <div className="h-3 bg-gray-200 rounded" />
        </div>
        <div className="h-8 w-32 bg-gray-300 rounded mt-3" />
      </div>

      {/* Vehicle section */}
      <div className="infoSection space-y-2">
        <div className="h-4 w-20 bg-gray-300 rounded" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-3 bg-gray-200 rounded" />
          <div className="h-3 bg-gray-200 rounded" />
          <div className="h-3 bg-gray-200 rounded" />
          <div className="h-3 bg-gray-200 rounded" />
        </div>
        <div className="h-8 w-36 bg-gray-300 rounded mt-3" />
      </div>
    </div>
  );
}
