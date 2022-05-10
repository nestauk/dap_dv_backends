import * as _ from 'lamb';
import { trim } from '@svizzle/utils';

export const toLowerString = v => v.toString().toLowerCase();

// tag function to dedent template literals
export const dedent = _.pipe([
	_.head, // first argument is strings
	_.splitBy('\n'),
	_.mapWith(trim),
	_.joinWith('\n'),
	trim
]);

export const hasOnlyLatinCharacters = str => (/^[a-zA-Z:]+$/u).test(str);
export const hasNonAsciiCharacters = str => (/^[\u0000-\u007f]*$/u).test(str);
