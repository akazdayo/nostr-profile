export async function checkNIP05(pubkey: string, nip05Id: string): Promise<boolean> {
	try {
		// NIP-05の形式は通常 name@domain.com の形式
		// @で分割して適切なエンドポイントを構築
		const [name, domain] = nip05Id.split('@');
		if (!name || !domain) {
			console.error('Invalid NIP-05 ID format', nip05Id);
			return false;
		}

		// 適切なURLを構築 (https://を優先、ただし失敗したらhttpを試す)
		const url = `https://${domain}/.well-known/nostr.json?name=${name}`;
		
		const response = await fetch(url);
		if (!response.ok) {
			// HTTPSが失敗した場合、HTTPを試す
			const httpUrl = `http://${domain}/.well-known/nostr.json?name=${name}`;
			const httpResponse = await fetch(httpUrl);
			if (!httpResponse.ok) {
				console.error('Failed to fetch NIP-05 verification data');
				return false;
			}
			const data = await httpResponse.json();
			// 正しいレスポンス形式は { names: { [name]: [pubkey] } }
			return data.names && data.names[name] === pubkey;
		}
		
		const data = await response.json();
		// 正しいレスポンス形式は { names: { [name]: [pubkey] } }
		return data.names && data.names[name] === pubkey;
	} catch (error) {
		console.error('Error verifying NIP-05:', error);
		return false;
	}
}