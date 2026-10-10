const API_HOST = `http://${process.env.WEB_SERVER_HOST || 'localhost'}:${process.env.WEB_SERVER_PORT || '7778'}`;

export const fetchData = async () => {
	try {
		const resp = await fetch(`${API_HOST}/start`);

		return await resp.json();
	} catch (error) {
		return {};
	}
};

export const fetchIssue = async (key: string) => {
	try {
		const resp = await fetch(`${API_HOST}/issue?query=${key}`);

		return await resp.json();
	} catch (error) {
		return {};
	}
};

export const deleteIssue = async (id: string) => {
	return await fetch(`${API_HOST}/issue?query=${id}`, {
		method: 'DELETE',
	})
};

export const saveIssue = async (payload: any) => {
	const resp = await fetch(`${API_HOST}/issue`, {
		method: 'POST',
		body: JSON.stringify(payload),
	})

	return await resp.json();
};

export const updateSprintIssues = async () => {
	try {
		const resp = await fetch(`${API_HOST}/issues`);

		return await resp.json();
	} catch (error) {
		return {};
	}
};

// Реальная синхронизация задач из спринта через SSE (GET /issues/stream).
// onProgress получает { processed, total } по мере перебора страниц Jira,
// onDone — итоговый payload, onFail — ошибку (стрим или ошибка Jira).
export const updateSprintIssuesStream = (
	onProgress: (progress: { processed: number; total: number }) => void,
	onDone: (payload: any) => void,
	onFail?: (error: any) => void,
) => {
	const source = new EventSource(`${API_HOST}/issues/stream`);

	let finished = false;

	const finish = () => {
		finished = true;
		source.close();
	};

	const parse = (event: any, fallback: any) => {
		try {
			return JSON.parse(event.data);
		} catch (ignore) {
			return fallback;
		}
	};

	source.addEventListener('progress', (event: any) => onProgress(parse(event, { processed: 0, total: 0 })));

	source.addEventListener('done', (event: any) => {
		const payload = parse(event, {});

		finish();
		onDone(payload);
	});

	source.addEventListener('fail', (event: any) => {
		const error = parse(event, { message: 'Update failed' });

		finish();
		onFail?.(error);
	});

	source.onerror = () => {
		// Штатное закрытие стрима после done/fail уже обработано — не считаем ошибкой.
		if (finished) {
			return;
		}

		finish();
		onFail?.({ message: 'Connection error' });
	};

	return source;
};

export const deleteIssues = async (payload?: any) => {
	return await fetch(`${API_HOST}/issues`, {
		method: 'DELETE',
		...(payload ? { body: JSON.stringify(payload) } : {}),
	})
};

export const refetchIssues = async (payload: any) => {
	const resp = await fetch(`${API_HOST}/issues`, {
		method: 'PATCH',
		body: JSON.stringify(payload),
	})

	return await resp.json();
};

export const setList = async (payload: any) => {
	return await fetch(`${API_HOST}/list`, {
		method: 'POST',
		body: JSON.stringify(payload),
	})
};

export const setListJql = async (payload: any) => {
	return await fetch(`${API_HOST}/list/jql`, {
		method: 'POST',
		body: JSON.stringify(payload),
	})
};


export const runRandomJql = async (query: string) => {
	return await fetch(`${API_HOST}/randomJql`, {
		method: 'POST',
		body: JSON.stringify({ query }),
	});
};