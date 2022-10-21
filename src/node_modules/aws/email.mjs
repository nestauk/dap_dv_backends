import { defaultProvider } from '@aws-sdk/credential-provider-node';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

const client = new SESClient({
	credentials: defaultProvider(),
	region: 'eu-west-2',
});

export const sendEmail = async (email, source, message, subject) => {
	const input = {
		Source: source,
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
				Data: subject,
			},
		},
	};
	const command = new SendEmailCommand(input);
	const response = await client.send(command);
	return response;
};
