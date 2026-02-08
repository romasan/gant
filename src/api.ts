const API_HOST = 'http://localhost:7778';

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
