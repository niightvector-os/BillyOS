export type TavilySource = { title: string; url: string; content: string };

export async function tavilySearch(query: string, maxResults = 6): Promise<TavilySource[]> {
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: process.env.TAVILY_API_KEY,
      query,
      search_depth: "advanced",
      max_results: maxResults,
      include_answer: false,
    }),
  });
  if (!res.ok) throw new Error("Search failed");
  const data = await res.json();
  return (data.results || []) as TavilySource[];
}
