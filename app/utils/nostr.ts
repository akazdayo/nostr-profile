import { type Event, type Filter, SimplePool } from "nostr-tools";

export interface NostrProfile {
	pubkey: string;
	name?: string;
	display_name?: string;
	picture?: string;
	banner?: string;
	about?: string;
	website?: string;
	nip05?: string;
	lud16?: string;
}

/**
 * 指定された公開鍵のNostrプロフィール情報を取得する
 * @param pubkey - Nostrの公開鍵（hex形式）
 * @param relayUrls - 接続するリレーサーバーのURL配列
 * @returns プロフィール情報
 */
export async function getUserProfile(
	pubkey: string,
	relayUrls: string[],
): Promise<NostrProfile> {
	return new Promise((resolve, reject) => {
		const ws = new WebSocket(relayUrls[0]);

		ws.onopen = () => {
			ws.send(
				JSON.stringify(["REQ", "profile", {
					authors: [pubkey],
					kinds: [0],
				}]),
			);
		};

		ws.onmessage = (event) => {
			const data = JSON.parse(event.data);
			if (data[0] === "EVENT" && data[1] === "profile") {
				// プロフィール情報を取得
				const content = data[2].content;
				const profile = JSON.parse(content) as NostrProfile;
				console.log("Parsed profile:", profile);
				resolve({ ...profile, pubkey });
				ws.close();
			}
		};

		ws.onerror = (error) => {
			reject(error);
		};

		// Add timeout to avoid hanging indefinitely
		setTimeout(() => {
			reject(new Error("Timeout waiting for profile data"));
			ws.close();
		}, 10000);
	});
}
