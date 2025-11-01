export const DIGITS = /^\d+$/;

export const parseFormData = (
	data: FormData
): unknown => {
	const parsed: any = {};

	for (const [k, v] of data.entries()) {
		const path = k.split(".");
		let chunks = path.slice();
		let target = parsed;

		while (chunks.length > 1) {
			const chunk = chunks.shift()!;
			if (DIGITS.test(chunks[0])) {
				target[chunk] ??= [];
			} else {
				target[chunk] ??= {};
			}
			target = target[chunk];
		}

		target[chunks.shift()!] = v;
	}

	return parsed;
};
