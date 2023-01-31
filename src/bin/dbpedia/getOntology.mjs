import { promises as fs } from 'fs';

import { saveObj } from '@svizzle/file';
import * as _ from 'lamb';

import { query } from 'dap_dv_backends_utils/sparql/query.mjs';
import { hasNonAsciiCharacters } from 'dap_dv_backends_utils/util/string.mjs';


const ONTOLOGY_SPARQL_QUERY = 'src/bin/dbpedia/getDBpediaOntology.sparql';
const FILE_ONTOLOGY_JSON = 'data/dbpedia/ontology.json';

const parse = classes => {
	const classesWithRoot = [
		..._.map(classes, class_ => ({...class_, children: []})),
		{
			class_: 'http://www.w3.org/2002/07/owl#Thing',
			parentClass: null,
			children: []
		}
	];
	const tree = _.make(_.map(classesWithRoot, _.getKey('class_')), classesWithRoot);
	_.map(classesWithRoot, node => {
		if (node.parentClass && node.parentClass in tree) {
			tree[node.parentClass].children.push(node.class_);
		}
	});

	// tag depths
	const root = 'http://www.w3.org/2002/07/owl#Thing';
	let curr;
	let stack = [{ node: root, depth: 0}];
	while (stack.length) {
		[curr, ...stack] = stack;
		tree[curr.node].depth = curr.depth;
		const { children } = tree[curr.node];
		stack = [
			...stack,
			// eslint-disable-next-line no-loop-func
			..._.map(children, child => ({ node: child, depth: curr.depth + 1}))
		];
	}

	return tree;
};


const main = async () => {

	const getOntologyQuery = await fs.readFile(ONTOLOGY_SPARQL_QUERY);
	const result = await query(getOntologyQuery);
	const parsedResult = _.map(
		result.results.bindings,
		binding => ({
			..._.mapValues(binding, _.getKey('value')),
		})
	);
	const englishClasses = _.filter(
		parsedResult,
		({ class_ }) => hasNonAsciiCharacters(class_)
	);
	const tree = parse(englishClasses);

	saveObj(FILE_ONTOLOGY_JSON, 4)(tree);
};

main();
