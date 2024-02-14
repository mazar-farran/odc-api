import { generate } from 'shortid';
import { db, getAsync, runAsync } from './index';

const ANONYMOUS_ID_FIELD = "anonymousId";

export const addDeviceInfo = async (): Promise<void> => {
    const anonymousId = generate();
    return new Promise(async (resolve) => {
        const insertSQL = `
          INSERT OR IGNORE INTO deviceInfo (
            key, value
          ) VALUES (?,?);
        `;
        try {
            await runAsync(db, insertSQL, [
                ANONYMOUS_ID_FIELD,
                anonymousId,
            ]);
        } catch (error) {
            console.error('Error adding row to Device Info table:', error);
        }
        resolve();
    });
};

export const getAnonymousID = async (): Promise<number> => {
    try {
        const row: any = await getAsync(
            db,
            `SELECT value FROM deviceInfo WHERE key=${ANONYMOUS_ID_FIELD};`,
        );
        return row[0]?.value;
    } catch (error) {
        console.error('Error getting anonymous ID from Device Info table:', error);
        return 0;
    }
};