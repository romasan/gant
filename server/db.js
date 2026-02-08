const fs = require('fs');
const filePath = __dirname + '/../db.json';

let db = {};

if (fs.existsSync(filePath)) {
	try {
		const file = fs.readFileSync(filePath).toString();

		db = JSON.parse(file);
	} catch (error) { }
}

const prevalidate = () => {
	[
		'dateRange',
		'projects',
		'team',
		'issues',
		'weekends',
	].forEach((key) => {
		if (!db[key]) {
			db[key] = [];
		}
	});

	if (!db.jql) {
		db.jql = {};
	}

	[
		'projects',
		'excludeTypes',
		'excludedStatuses',
		'components',
	].forEach((key) => {
		if (!db.jql[key]) {
			db.jql[key] = [];
		}
	});
};

prevalidate();


const save = () => {
	fs.writeFileSync(filePath, JSON.stringify(db, null, 2))
};

const isPrimitive = (value) =>
	typeof value === 'boolean' ||
	typeof value === 'number' ||
	typeof value === 'string' ||
	Array.isArray(value);

const merge = (a, b) => {
	if (isPrimitive(b)) {
		return;
	}

	for (const key in b) {
		if (isPrimitive(b[key])) {
			a[key] = b[key];
		} else {
			merge(a[key], b[key]);
		}
	}
}

const set = (key, value) => {
	db[key] = value;
	save();
}

const insert = (obj) => {
	merge(db, obj);
	save();
};

const get = (key) => key ? db[key] : db;

module.exports = {
	insert,
	get,
	set,
};
