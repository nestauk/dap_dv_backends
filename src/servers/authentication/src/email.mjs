import { defaultProvider } from '@aws-sdk/credential-provider-node';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

import { BACKEND_BASE } from './config.mjs';
import { generateToken } from './crypto.mjs';

const client = new SESClient({
	credentials: defaultProvider(),
	region: 'eu-west-2',
});

export const sendEmail = async email => {
	const token = generateToken();

	const link = new URL('provide', BACKEND_BASE);
	link.searchParams.append('email', email);
	link.searchParams.append('token', token);

	const message = `
		Token: <b>${token}</b><br>
		Please click the following link to verify your email<br>
		<a href="${link.toString()}">Click here</a><br>
		If you don't verify your email, your token above will not work.`;

	const input = {
		Source: 'authenticate@dap-tools.uk',
		Destination: {
			ToAddresses: [email],
		},
		Message: {
			Body: {
				Html: {
					Charset: 'UTF-8',
					Data: message,
				},
			},
			Subject: {
				Charset: 'UTF-8',
				Data: 'Nesta verification email',
			},
		},
	};
	const command = new SendEmailCommand(input);
	const response = await client.send(command);
	return response;
};
