import { nip19 } from "nostr-tools";

/**
 * bech32形式のnostr公開鍵をhex形式に変換する
 * @param npub - bech32形式の公開鍵（例：npub1...）
 * @returns hex形式の公開鍵
 */
export default function toHex(npub: string): string {
    try {
        if (!npub.startsWith("npub1")) {
            throw new Error("Invalid npub format: must start with npub1");
        }

        const { type, data } = nip19.decode(npub);
        if (type !== "npub") {
            throw new Error(`Invalid type: expected npub, got ${type}`);
        }

        return data as string;
    } catch (error) {
        console.error("Error converting npub to hex:", error);
        throw new Error("Failed to convert npub to hex");
    }
}
