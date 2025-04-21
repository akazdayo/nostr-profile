import { Hono } from "hono";
import { handle } from "hono/vercel";
import { getUserProfile } from "../../utils/nostr";
import { generateProfileSvg } from "../../utils/generateSvg";
import { checkNIP05 } from "../../utils/nip05";

export const runtime = "edge";

const app = new Hono().basePath("/api");

app.get("/hello", (c) => {
	return c.json({
		message: "Hello from Hono!",
	});
});
app.get("/profile/:publicKey", async (c) => {
	const publicKey = c.req.param("publicKey");
	const profile = await getUserProfile(publicKey, [
		"wss://yabu.me",
	]).catch((error) => {
		console.error("Error fetching profile:", error);
		throw c.json(
			{ error: "Failed to fetch profile" },
			{ status: 500 },
		);
	});

	// プロフィール画像をbase64エンコードする
	let imageData = "";
	if (profile.picture) {
		try {
			const imageResponse = await fetch(profile.picture);
			const arrayBuffer = await imageResponse.arrayBuffer();
			const base64 = Buffer.from(arrayBuffer).toString("base64");
			const contentType = imageResponse.headers.get("content-type");
			imageData = `data:${contentType};base64,${base64}`;
			profile.picture = imageData;
		} catch (error) {
			console.error("Error fetching profile image:", error);
			// エラーが発生した場合はデフォルトアイコンを使用
			profile.picture = undefined;
		}
	}

	// NIP-05検証を実行
	let nip05Verified = false;
	if (profile.nip05) {
		nip05Verified = await checkNIP05(publicKey, profile.nip05);
		console.log(
			`NIP-05 verification for ${profile.nip05}: ${nip05Verified}`,
		);
	}

	// 検証結果を含めてSVGを生成
	const response = generateProfileSvg(profile, { nip05Verified });
	return c.body(response, 200, {
		"Content-Type": "image/svg+xml;charset=UTF-8",
		"Access-Control-Allow-Origin": "*",
	});
});

export const GET = handle(app);
