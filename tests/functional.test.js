/*
To add Jest and Axios libraries to your project and run tests, follow these steps:
Install Jest:
npm install --save-dev jest
Install Axios:
npm install axios
Add a test script to your package.json:
"scripts": {
"test": "jest"
}
Create test files with a .test.js extension
Write your tests using Jest and Axios
Run the tests:
npm test
These steps will set up Jest and Axios
 */

const axios = require('axios');

const API_URL = 'http://localhost:9926/subscriberlog';
const AUTH_HEADER = 'Basic secret_key';

describe('Subscriberlog Piracy Check Tests', () => {
	const makeRequest = async (data) => {
		return axios.post(API_URL, data, {
			headers: {
				'Authorization': AUTH_HEADER,
				'Content-Type': 'application/json'
			}
		});
	};

	const generateUniqueId = () => Date.now().toString();

	test('No conditions met', async () => {
		const response = await makeRequest({
			subscriberId: generateUniqueId(),
			clientsessionId: 'session1',
			Contentname: 'content1',
			clientIP: '1.1.1.1'
		});
		expect(response.status).toBe(200);
		expect(response.headers['x-subscriber-pirate']).toBe('False');
	});

	test('Condition A met: >50 requests for same subscriberId and Contentname', async () => {
		const subscriberId = generateUniqueId();
		for (let i = 0; i < 51; i++) {
			await makeRequest({
				subscriberId,
				clientsessionId: `session${i}`,
				Contentname: 'contentA',
				clientIP: '1.1.1.1'
			});
		}
		const response = await makeRequest({
			subscriberId,
			clientsessionId: 'sessionFinal',
			Contentname: 'contentA',
			clientIP: '1.1.1.1'
		});
		expect(response.headers['x-subscriber-pirate']).toBe('True');
		expect(response.headers['x-subscriber-condition']).toContain('high_requests');
	});

	test('Condition B met: >4 unique client IPs for same subscriberId and Contentname', async () => {
		const subscriberId = generateUniqueId();
		for (let i = 1; i <= 5; i++) {
			await makeRequest({
				subscriberId,
				clientsessionId: `session${i}`,
				Contentname: 'contentB',
				clientIP: `${i}.${i}.${i}.${i}`
			});
		}
		const response = await makeRequest({
			subscriberId,
			clientsessionId: 'sessionFinal',
			Contentname: 'contentB',
			clientIP: '6.6.6.6'
		});
		expect(response.headers['x-subscriber-pirate']).toBe('True');
		expect(response.headers['x-subscriber-condition']).toContain('high_ip_count');
	});

	test('Condition C met: >4 unique ContentNames for same subscriberId', async () => {
		const subscriberId = generateUniqueId();
		for (let i = 1; i <= 5; i++) {
			await makeRequest({
				subscriberId,
				clientsessionId: `session${i}`,
				Contentname: `content${i}`,
				clientIP: '1.1.1.1'
			});
		}
		const response = await makeRequest({
			subscriberId,
			clientsessionId: 'sessionFinal',
			Contentname: 'contentFinal',
			clientIP: '1.1.1.1'
		});
		expect(response.headers['x-subscriber-pirate']).toBe('True');
		expect(response.headers['x-subscriber-condition']).toContain('multiple_content_views');
	});

	test('Condition D met: >1 unique SessionID for same subscriberId and clientIP', async () => {
		const subscriberId = generateUniqueId();
		const clientIP = '1.1.1.1';

		// Insert the first log entry with a specific session ID
		await makeRequest({
			subscriberId,
			clientsessionId: 'session1',
			Contentname: 'contentD',
			clientIP
		});

		// Insert the second log entry with a different session ID but same subscriberId and clientIP
		await makeRequest({
			subscriberId,
			clientsessionId: 'session2',
			Contentname: 'contentD',
			clientIP
		});

		// Make a final request to trigger the piracy check
		const response = await makeRequest({
			subscriberId,
			clientsessionId: 'session3', // Another unique session ID
			Contentname: 'contentD',
			clientIP
		});

		// Assert that the response indicates piracy (Condition D met)
		expect(response.status).toBe(200);
		expect(response.headers['x-subscriber-pirate']).toBe('True');
		expect(response.headers['x-subscriber-condition']).toContain('multiple_sessions');
	});
});