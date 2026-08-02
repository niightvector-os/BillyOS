export type WikiImage = { title: string; url: string; pageUrl: string };

export async function fetchWikipediaImages(query: string, limit = 4): Promise<WikiImage[]> {
  const url = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
    query
  )}&gsrlimit=${limit}&prop=pageimages|info&inprop=url&piprop=thumbnail&pithumbsize=500&format=json&origin=*`;
  const res = await fetch(url, { headers: { "User-Agent": "BillyOS/0.1 (personal project)" } });
  const data = await res.json();
  const pages = data?.query?.pages;
  if (!pages) return [];
  return Object.values(pages)
    .filter((p: any) => p.thumbnail)
    .map((p: any) => ({ title: p.title, url: p.thumbnail.source, pageUrl: p.fullurl }))
    .slice(0, limit);
}
