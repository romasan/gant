import s from './PriorityLabel.module.scss';

const icons: Record<string, string> = {
	'a': 'https://jira.vk.team/images/icons/priorities/minor.svg',
	'b': 'https://jira.vk.team/images/icons/priorities/minor_new.svg',
	'Стандартный': 'https://jira.vk.team/images/icons/priorities/medium.svg',
	'Normal': 'https://jira.vk.team/images/icons/priorities/medium.svg',
	'd': 'https://jira.vk.team/images/icons/priorities/major.svg',
	'Критический': 'https://jira.vk.team/images/icons/priorities/critical.svg',
};

export const PriorityLabel = ({ priority }: { priority: string }) => {
	if (!priority) {
		return null;
	}

	return (
		<>
			{
				icons[priority]
					? <img src={icons[priority]} className={s.icon} />
					: (
						<>
							"{priority}"
						</>
					)
			}
		</>
	);
};
