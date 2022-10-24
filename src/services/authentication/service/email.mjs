import { sendEmail } from 'aws/email.mjs';
import { BACKEND_BASE, SOURCE_EMAIL } from '../config.mjs';
import { generateToken } from './crypto.mjs';

export const sentTokenEmail = async email => {
	const token = generateToken();

	const link = new URL('provide', BACKEND_BASE);
	link.searchParams.append('email', email);
	link.searchParams.append('token', token);

	const message = `
		Token: <b>${token}</b><br>
		Please click the following link to verify your email<br>
		<a href="${link.toString()}">Click here</a><br>
		If you don't verify your email, your token above will not work.`;

	const response = await sendEmail(
		email,
		SOURCE_EMAIL,
		message,
		'Nesta verification email'
	);
	return response;
};
