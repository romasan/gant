const { updateIssues } = require('../jira');

// SSE-стрим синхронизации задач из спринта.
// Клиент (EventSource) получает события progress (реальный прогресс по страницам Jira),
// затем done (итоговый payload) либо fail (ошибка).
// CORS-заголовки выставляются глобально в server/index.js до маршрутизации.
const issuesStream = async (req, res) => {
	res.setHeader('Content-Type', 'text/event-stream');
	res.setHeader('Cache-Control', 'no-cache, no-transform');
	res.setHeader('Connection', 'keep-alive');

	if (typeof res.flushHeaders === 'function') {
		res.flushHeaders();
	}

	let closed = false;

	req.on('close', () => {
		closed = true;
	});

	const send = (event, data) => {
		if (closed) {
			return;
		}

		res.write(`event: ${event}\n`);
		res.write(`data: ${JSON.stringify(data)}\n\n`);
	};

	try {
		const payload = await updateIssues((progress) => send('progress', progress));

		send('done', payload || {});
	} catch (error) {
		send('fail', { message: String(error) });
	}

	if (!closed) {
		res.end();
	}
};

module.exports = {
	issuesStream,
};
