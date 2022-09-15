import * as _ from 'lamb';

import { getValue, isIterableLongerThan1 } from '@svizzle/utils';

import { loadOntology } from 'dbpedia/ontology.mjs';
import { dbr, prefixes } from 'dbpedia/util.mjs';
import { query } from 'sparql/query.mjs';

const sanitizeInput = input => {
	const URIs = typeof input === 'string' ? [input] : input;
	const sanitizedURIs = _.map(URIs, URI =>
		URI.charAt(0) !== '<'
			? URI.startsWith(dbr) ? `<${URI}>` : `<${dbr}${URI}>`
			: URI
	);
	return sanitizedURIs;
};

const buildIndividualQueries = (inputs, template) => _.map(
	inputs,
	input => _.replace(/\$\$URI\$\$/gu, input)(template)
);

const buildQuery = queries => {
	const body = _.join(queries, '\nUNION\n');
	const sparql = `
	${prefixes}
	SELECT * WHERE {
		${body}
	}`;
	return sparql;
};

const makeRequest = async sparql => {
	const { results } = await query(sparql);
	const values = _.map(results.bindings, _.mapValuesWith(getValue));
	return values;
};

const genericRequest = async (input, template) => {
	const sanitizedInput = sanitizeInput(input);
	const queries = buildIndividualQueries(sanitizedInput, template);
	const sparql = buildQuery(queries);
	const values = await makeRequest(sparql);
	return values;
};

/**
 * @function getEntityDetails
 * @description provides details such as imageURL and abstract for supplied DBpedia URIs
 * @param {String|String[]} input - a single DBpedia URI or a list of URIs.
 * @returns a list of entities for the supplied DBPedia URIs.
 */
export const getEntityDetails = async input => {
	const template =
		`{
			BIND ($$URI$$ as ?URI)
			OPTIONAL { 
				$$URI$$ dbo:abstract ?abstract .
				FILTER (langMatches(lang(?abstract),"en"))
			}
			OPTIONAL { $$URI$$ prov:wasDerivedFrom ?derivedFrom . }
			OPTIONAL { $$URI$$ dbo:thumbnail ?imageURL . }
		}`;

	const values = await genericRequest(input, template);

	// filter out bad encodings
	const filteredValues = _.map(values, entity => {
		if ('imageURL' in entity) {
			if (entity.imageURL.includes('�')) {
				const { imageURL, ...rest } = entity;
				return rest;
			}
		}
		return entity;
	});

	return filteredValues;
};

export const getEntityAbstract = input => {
	const template = `{
		BIND ($$URI$$ as ?URI)
		OPTIONAL { 
			$$URI$$ dbo:abstract ?abstract .
			FILTER (langMatches(lang(?abstract),"en"))
		}
	}`;
	return genericRequest(input, template);
};

export const isDisambiguation = async input => {
	const template = `{
		BIND ($$URI$$ as ?title)
		OPTIONAL { $$URI$$ dbo:wikiPageDisambiguates ?resource . }
	}`;
	const values = await genericRequest(input, template);
	const groups = _.group(values, _.getKey('title'));

	// if the dbo:wikiPageDisambiguates predicate returns at least one value
	// for the URI, then it's a disambiguation page. As the title binding
	// will always be found, we check for length > 1
	const disambiguations = _.mapValues(groups, isIterableLongerThan1);
	return disambiguations;
};

export const getClasses = async (
	input,
	{
		depth=Infinity,
		squash=true,
		fullURI=true
	} = {}
) => {

	const template = `{
			BIND ($$URI$$ as ?title)
			OPTIONAL { $$URI$$ rdf:type ?type . }
	}`;
	const values = await genericRequest(input, template);
	const groups = _.group(values, _.getKey('title'));
	const types = _.mapValues(groups, group => _.map(group, _.getKey('type')));
	const classFilter = await loadOntology(depth);
	const filteredTypes = _.mapValues(
		types,
		typeList => {
			const filtered = _.filter(typeList, t => t in classFilter);
			const squashed = squash
				? filtered
				: _.map(filtered, key => _.getIn(classFilter, key));
			const URIs = fullURI
				? squashed
				: JSON.parse(stringify(squashed).replaceAll(dbo, ''));
			return URIs;
		}
	);
	return filteredTypes;
};

export const hasInfoBoxTemplate = async input => {
	const template = `{
			BIND ($$URI$$ as ?URI)
			OPTIONAL { $$URI$$ dbp:wikiPageUsesTemplate ?template . }
	}`;
	const values = await genericRequest(input, template);
	const groups = _.group(values, _.getKey('URI'));
	const wikiTemplates = _.mapValues(groups, _.pluck('template'));
	const infobox =  'http://dbpedia.org/resource/Template:Infobox';

	const results = _.mapValues(
		wikiTemplates,
		_.some(t => (t || '').startsWith(infobox))
	);
	return results;
};
