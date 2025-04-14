import { SimplePool, type Filter, type Event } from "nostr-tools";

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
	const pool = new SimplePool();

	try {
		const filter: Filter = {
			kinds: [0],
			authors: [pubkey],
		};

		// リレーから最新のプロフィールイベントを取得
		const event: Event | null = await pool.get(relayUrls, filter);
		if (!event) {
			throw new Error("No events found");
		}

		// 最新のイベントを使用
		const profile = JSON.parse(event.content);

		let content: Record<string, string> = {};
		try {
			content = profile;
		} catch (e) {
			console.error("Failed to parse profile content:", e);
		}

		// プロフィール情報を構造化して返却
		return {
			pubkey,
			name: content.name,
			display_name: content.display_name,
			picture: content.picture,
			banner: content.banner,
			about: content.about,
			website: content.website,
			nip05: content.nip05,
			lud16: content.lud16,
		};
	} catch (error) {
		console.error("Failed to fetch profile:", error);
		throw error;
	}
}