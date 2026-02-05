const getSearch = (req) => req.url.split('?')[1]?.split('&')
	.map((e) => e.split('='))
	.reduce((list, [key, value]) => ({ ...list, [key]: value }), {}) || {};

const getPostPayload = (req, type = 'text') => {
	return new Promise((resolve, reject) => {
		let body = '';

		req.on('data', (chunk) => {
			body += chunk.toString();
		});

		req.on('end', () => {
			if (type === 'json') {
				let json = {};

				try {
					json = JSON.parse(body);
				} catch (ignore) {/* */}

				resolve(json);

				return;
			}

			resolve(body);
		});

		req.on('error', () => {
			reject();
		});
	});
};

module.exports = {
	getSearch,
	getPostPayload,
};
