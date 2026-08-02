import { getLocations, getRouteIfRequested } from "@/lib/geocode";

export async function POST(req: Request) {
  const { topic } = await req.json();

  const routeResult = await getRouteIfRequested(topic);
  if (routeResult) {
    return Response.json({
      topic,
      isRoute: true,
      origin: routeResult.origin,
      destination: routeResult.destination,
      routes: routeResult.routes,
      locations: [routeResult.origin, routeResult.destination],
    });
  }

  const locations = await getLocations(topic, 5);
  if (locations.length === 0) {
    return Response.json({ error: "Couldn't find real-world locations for that." }, { status: 404 });
  }

  return Response.json({ topic, isRoute: false, locations });
}
