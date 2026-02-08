import s from './LegendModal.module.scss';

export const LegendModal = () => {
	return (
		<div className={s.root}>
			<div className={s.item}><span className={s.devready} /> Devready</div>
			<div className={s.item}><span className={s.develop} /> Develop</div>
			<div className={s.item}><span className={s.review} /> Review</div>
			<div className={s.item}><span className={s.testready} /> Testready</div>
			<div className={s.item}><span className={s.testing} /> Testing</div>
			<div className={s.item}><span className={s.testdone} /> Testdone</div>
			<div className={s.item}><span className={s.deploy} /> Deploy</div>
			<div className={s.item}><span className={s.designreview} /> Design review</div>
			<div className={s.item}><span className={s.awaiting} /> Awaiting</div>
			<div className={s.item}><span className={s.waitingforrelated} /> Waiting for related</div>
			<div className={s.item}><span className={s.done} /> Done</div>
		</div>
	);
};
