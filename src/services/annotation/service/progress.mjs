import { performance } from 'perf_hooks';


export const Progress = class {
	constructor(total, callback) {
		this.total = total;
		this.callback = callback;
		this.current = 0;
		this.startTime = performance.now();
		this.endTime = null;
	}

	increment(amount) {
		this.current += amount;
	};

	setTotal(total) {
		this.total = total;
	}

	status() {
		if (this.current === 0) {
			return { status: 'provisioning' };
		}
		if (this.current === this.total) {
			return {
				status: 'finished',
				timeTakenInMS: this.endTime - this.startTime
			};
		}
		return {
			status: 'annotating',
			progress: this.current,
			total: this.total
		};
	}

	stop() {
		this.current = this.total;
		this.endTime = performance.now();
		this.callback();
	}
};
