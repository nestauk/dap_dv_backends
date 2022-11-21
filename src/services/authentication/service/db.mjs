import * as _ from 'lamb';
import { createClient } from 'redis';

export const redisClient = createClient({ socket: { host: 'redis' } });
redisClient.on('error', err => console.log('Redis Client Error', err));
await redisClient.connect();
