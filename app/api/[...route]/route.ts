import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import { getUserProfile } from "../../utils/nostr"
import { generateProfileSvg } from "../../utils/generateSvg";
import { checkNIP05 } from "../../utils/nip05";

export const runtime = 'edge'

const app = new Hono().basePath('/api')

app.get('/hello', (c) => {
  return c.json({
    message: 'Hello from Hono!'
  })
})
app.get("/profile/:publicKey", async (c) => {
	const publicKey = c.req.param("publicKey");
	const profile = await getUserProfile(publicKey, [
		"wss://relay.damus.io",
		"wss://yabu.me",
	]);

	// NIP-05検証を実行
	let nip05Verified = false;
	if (profile.nip05) {
		nip05Verified = await checkNIP05(publicKey, profile.nip05);
		console.log(`NIP-05 verification for ${profile.nip05}: ${nip05Verified}`);
	}

	// 検証結果を含めてSVGを生成
	const response = generateProfileSvg(profile, { nip05Verified });
	return c.html(response);
});

export const GET = handle(app)
