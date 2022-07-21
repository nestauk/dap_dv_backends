export const defaultMapping = {
	type: 'nested',
	properties: {
		URI: {
			type: 'keyword',
		},
		confidence: {
			type: 'integer',
		},
		percentageOfSecondRank: {
			type: 'float',
		},
		similarityScore: {
			type: 'float',
		},
		surfaceForm: {
			type: 'text',
		},
		duplicates_60: {
			type: 'integer',
		},
		duplicates_10: {
			type: 'integer',
		}
	},
};

export const metaDataMapping = {
	properties: {
		confidence_avg: {
			type: 'float'
		},
		confidence_max: {
			type: 'integer'
		},
		confidence_min: {
			type: 'integer'
		},
		entities_count: {
			type: 'integer'
		},
		dupes_10_ratio: {
			type: 'float'
		},
		dupes_60_ratio: {
			type: 'float'
		},
		dupes_10_count: {
			type: 'integer'
		},
		dupes_60_count: {
			type: 'integer'
		},
		confidence_counts: {
			properties: {
				"0": {
					type: 'integer'
				},
				"10": {
					type: 'integer'
				},
				"20": {
					type: 'integer'
				},
				"30": {
					type: 'integer'
				},
				"40": {
					type: 'integer'
				},
				"50": {
					type: 'integer'
				},
				"60": {
					type: 'integer'
				},
				"70": {
					type: 'integer'
				},
				"80": {
					type: 'integer'
				},
				"90": {
					type: 'integer'
				},
				"100": {
					type: 'integer'
				}
			}
		}
	}

};
