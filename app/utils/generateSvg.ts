import type { NostrProfile } from "./nostr";

// Basic XML escaping function
function escapeXml(unsafe: string): string {
	return unsafe.replace(/[<>&'"]/g, (c) => {
		switch (c) {
			case "<":
				return "<";
			case ">":
				return ">";
			case "&":
				return "&amp;";
			case "'":
				return "&apos;";
			case '"':
				return "&quot;"; // Corrected escape for double quote
			default:
				return c;
		}
	});
}

// Function to wrap text into multiple lines
function wrapText(text: string, maxWidth: number, charWidth: number): string[] {
	const lines: string[] = [];
	const words = text.split(/\s+/);
	let currentLine = "";
	const maxCharsPerLine = Math.floor(maxWidth / charWidth);

	for (const word of words) {
		if (currentLine.length === 0) {
			if (word.length > maxCharsPerLine) {
				// Handle very long words (split them)
				let remainingWord = word;
				while (remainingWord.length > maxCharsPerLine) {
					lines.push(remainingWord.substring(0, maxCharsPerLine));
					remainingWord = remainingWord.substring(maxCharsPerLine);
				}
				if (remainingWord.length > 0) {
					currentLine = remainingWord;
				}
			} else {
				currentLine = word;
			}
		} else {
			const potentialLine = `${currentLine} ${word}`;
			if (potentialLine.length <= maxCharsPerLine) {
				currentLine = potentialLine;
			} else {
				lines.push(currentLine);
				if (word.length > maxCharsPerLine) {
					// Handle very long words starting on a new line
					let remainingWord = word;
					while (remainingWord.length > maxCharsPerLine) {
						lines.push(remainingWord.substring(0, maxCharsPerLine));
						remainingWord = remainingWord.substring(
							maxCharsPerLine,
						);
					}
					currentLine = remainingWord.length > 0 ? remainingWord : "";
				} else {
					currentLine = word;
				}
			}
		}
	}
	if (currentLine.length > 0) {
		lines.push(currentLine);
	}
	return lines;
}

export function generateProfileSvg(
	profile: NostrProfile,
	options: { nip05Verified?: boolean } = {},
): string {
	const { name, display_name, picture, nip05, lud16, about } = profile;
	const { nip05Verified } = options;

	const width = 400;
	const height = 150;
	const padding = 15;
	const iconSize = 60;
	const textStartX = padding + iconSize + 15;
	const textWidth = width - textStartX - padding;

	// --- Default values ---
	const displayName = display_name || name || "anonymous";
	const userName = name ? `@${name}` : "";
	const profilePicture = picture ||
		`data:image/svg+xml;base64,${
			Buffer.from(
				'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="#ccc"/><text x="50" y="60" font-size="30" text-anchor="middle" fill="#fff">?</text></svg>',
			).toString("base64")
		}`; // Default icon
	const aboutText = about || "";

	// --- Font styles ---
	// Using a common cursive font as a fallback for the hand-drawn style
	const fontFamily =
		"'Comic Sans MS', 'Chalkboard SE', 'marker felt', cursive";
	const nameFontSize = 14;
	const displayNameFontSize = 24;
	const nip05FontSize = 14;
	const aboutFontSize = 16;
	const lineHeight = 1.3; // For about text line spacing

	// --- Colors ---
	const bgColor = "#FFFFFF";
	const borderColor = "#000000";
	const nameColor = "#888888";
	const displayNameColor = "#000000";
	const nip05Color = "#005bff"; // Blue for verified NIP-05
	const aboutColor = "#000000";
	const defaultIconBg = "#cccccc";
	const defaultIconFg = "#ffffff";

	// --- Calculate About Text Lines ---
	// Estimate average character width (this is a rough approximation)
	const avgCharWidth = aboutFontSize * 0.6;
	const aboutLines = wrapText(aboutText, textWidth, avgCharWidth);
	const maxAboutLines = 3; // Limit number of lines for about text
	const truncatedAboutLines = aboutLines.slice(0, maxAboutLines);
	if (aboutLines.length > maxAboutLines) {
		truncatedAboutLines[maxAboutLines - 1] += "...";
	}

	// --- SVG Generation ---
	let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">`;

	// Add font styles within defs (optional, but good practice)
	svg += `
  <defs>
    <style>
      .name { font-family: ${fontFamily}; font-size: ${nameFontSize}px; fill: ${nameColor}; }
      .display-name { font-family: ${fontFamily}; font-size: ${displayNameFontSize}px; font-weight: bold; fill: ${displayNameColor}; }
      .nip05 { font-family: ${fontFamily}; font-size: ${nip05FontSize}px; fill: ${nip05Color}; }
      .about { font-family: ${fontFamily}; font-size: ${aboutFontSize}px; fill: ${aboutColor}; }
      .lud16 { font-family: ${fontFamily}; font-size: ${nip05FontSize}px; fill: #794bc4; } /* Lightning purple */
    </style>
    <clipPath id="clipCircle">
      <circle cx="${padding + iconSize / 2}" cy="${
		padding + iconSize / 2
	}" r="${iconSize / 2}" />
    </clipPath>
  </defs>`;

	// Background
	svg += `<rect x="1" y="1" width="${width - 2}" height="${
		height - 2
	}" rx="10" ry="10" fill="${bgColor}" stroke="${borderColor}" stroke-width="2"/>`;

	// Profile Picture
	svg += `<image href="${
		escapeXml(profilePicture)
	}" x="${padding}" y="${padding}" width="${iconSize}" height="${iconSize}" clip-path="url(#clipCircle)" />`;
	// Fallback border if image fails to load (optional)
	svg += `<circle cx="${padding + iconSize / 2}" cy="${
		padding + iconSize / 2
	}" r="${
		iconSize / 2
	}" stroke="${borderColor}" stroke-width="1" fill="none"/>`;

	// --- Text Elements ---
	let currentY = padding + nameFontSize + 5; // Start Y position for text

	// @name (if exists)
	if (userName) {
		svg += `<text x="${textStartX}" y="${currentY}" class="name">${
			escapeXml(userName)
		}</text>`;
		currentY += 5; // Add small gap
	}

	// Display Name
	currentY += displayNameFontSize;
	svg += `<text x="${textStartX}" y="${currentY}" class="display-name">${
		escapeXml(displayName)
	}</text>`;

	// NIP-05 and Checkmark (if verified)
	if (nip05) {
		const nip05Text = escapeXml(nip05);
		const nip05TextX = textStartX +
			displayName.length * (displayNameFontSize * 0.6) + 30; // Estimate position after display name
		const nip05TextY = currentY; // Align vertically with display name

		let nip05Display = "";
		if (nip05Verified) {
			// Blue Checkmark SVG (approximated)
			const checkMarkSvg = `<svg x="${nip05TextX}" y="${
				nip05TextY - nip05FontSize * 0.8
			}" width="${nip05FontSize}" height="${nip05FontSize}" viewBox="0 0 24 24" fill="${nip05Color}"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`;
			nip05Display += checkMarkSvg;
		}
		nip05Display += `<text x="${
			nip05TextX + (nip05Verified ? nip05FontSize + 5 : 0)
		}" y="${nip05TextY}" class="nip05">${nip05Text}</text>`;
		svg += nip05Display;
	}

	// Lightning Address (lud16) - Position below name/nip05
	currentY += 10; // Add gap
	if (lud16) {
		currentY += nip05FontSize;
		svg += `<text x="${textStartX}" y="${currentY}" class="lud16">⚡ ${
			escapeXml(lud16)
		}</text>`;
	}

	// About Text
	currentY += aboutFontSize * 1.5; // Move down for about text
	truncatedAboutLines.forEach((line, index) => {
		const lineY = currentY + index * (aboutFontSize * lineHeight);
		if (lineY < height - padding) {
			// Ensure text stays within bounds
			svg += `<text x="${padding}" y="${lineY}" class="about">${
				escapeXml(line)
			}</text>`;
		}
	});

	svg += "</svg>"; // Use regular string concatenation
	return svg;
}
