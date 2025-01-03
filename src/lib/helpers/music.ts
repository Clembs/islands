export async function getSpotifyToken(): Promise<string> {
	const re =
		/<script id="session" data-testid="session" type="application\/json"[^>]*>(.*?)<\/script>/;
	const sessionRes = await fetch('https://open.spotify.com/search')
		.then((res) => res.text())
		.then((str) => {
			console.log(str.match(re));
			return str.match(re)![1];
		})
		.then((json) => JSON.parse(json));

	return sessionRes.accessToken;
}

export type SpotifyTrack = {
	id: string;
	name: string;
	artists: { name: string; id: string }[];
	album: { name: string; images: { url: string }[]; href: string };
	external_urls: { spotify: string };
	preview_url: string;
};
