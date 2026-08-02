export default function TripPlanBlock({
  data,
}: {
  data: { destination: string; thingsToDo: string[]; hotelUrl: string; flightUrl: string };
}) {
  return (
    <div className="trip-plan-block">
      <div className="trip-plan-header">Plan your trip to {data.destination}</div>

      <div className="trip-plan-links">
        <a href={data.hotelUrl} target="_blank" rel="noopener noreferrer" className="trip-plan-link trip-plan-hotel">
          <span className="trip-plan-link-icon">🏨</span>
          <span>Search hotels on Booking.com</span>
          <span className="trip-plan-arrow">→</span>
        </a>
        <a href={data.flightUrl} target="_blank" rel="noopener noreferrer" className="trip-plan-link trip-plan-flight">
          <span className="trip-plan-link-icon">✈️</span>
          <span>Search flights on Google Flights</span>
          <span className="trip-plan-arrow">→</span>
        </a>
      </div>

      <div className="trip-plan-todo">
        <div className="trip-plan-todo-label">Things to do</div>
        <ul>
          {data.thingsToDo.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </div>

      <p className="trip-plan-note">Opens real Booking.com / Google Flights search results in a new tab — BillyOS doesn't pull live prices directly.</p>
    </div>
  );
}
