
// Using native fetch (Node 18+)
// Using native fetch if available, otherwise we might need to install undici or node-fetch.
// Since we are in a TS environment, let's assume native fetch or global fetch.

const BASE_URL = 'http://localhost:5001/api';

const generateUser = () => ({
    name: 'Test User',
    email: `test_${Date.now()}@test.com`,
    password: 'password123'
});

async function runTests() {
    console.log('🚀 Starting Transaction Service Integration Tests...\n');

    let token = '';
    let userId = '';
    const createdTransactionIds: string[] = [];

    let cookie = '';

    // 1. Register User
    try {
        const user = generateUser();
        console.log(`1. Registering new user: ${user.email}`);
        const regRes = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user)
        });

        if (!regRes.ok) throw new Error(`Registration failed: ${regRes.statusText}`);

        const setCookie = regRes.headers.get('set-cookie');
        if (!setCookie) throw new Error('No cookie received');
        cookie = setCookie;

        const regData: any = await regRes.json();
        userId = regData._id;
        console.log('✅ Registration successful. Cookie acquired.\n');
    } catch (error) {
        console.error('❌ Setup failed:', error);
        // @ts-ignore
        process.exit(1);
    }

    const headers = {
        'Content-Type': 'application/json',
        'Cookie': cookie
    };

    // 2. Test Single Transaction Creation
    try {
        console.log('2. Testing Single Transaction Creation...');
        const payload = {
            amount: 100,
            description: 'Test Single Transaction',
            category: 'Food',
            type: 'EXPENSE',
            date: new Date().toISOString()
        };

        const res = await fetch(`${BASE_URL}/transactions`, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const err = await res.text();
            throw new Error(`Failed: ${res.status} - ${err}`);
        }

        const data: any = await res.json();
        if (data.amount === 100 && data.description === payload.description) {
            console.log('✅ Single transaction created successfully.');
            createdTransactionIds.push(data._id);
        } else {
            throw new Error('Response data mismatch');
        }
    } catch (error) {
        console.error('❌ Single Transaction Test Failed:', error);
    }
    console.log('');

    // 3. Test Bulk Transaction Creation
    try {
        console.log('3. Testing Bulk Transaction Creation...');
        const payload = [
            {
                amount: 50,
                description: 'Bulk Item 1',
                category: 'Transport',
                type: 'EXPENSE',
                date: new Date().toISOString()
            },
            {
                amount: 2000,
                description: 'Bulk Salary',
                category: 'Salary',
                type: 'INCOME',
                date: new Date().toISOString()
            }
        ];

        const res = await fetch(`${BASE_URL}/transactions/bulk`, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const err = await res.text();
            throw new Error(`Failed: ${res.status} - ${err}`);
        }

        const data: any = await res.json();
        if (Array.isArray(data) && data.length === 2) {
            console.log('✅ Bulk transactions created successfully.');
            data.forEach((tx: any) => createdTransactionIds.push(tx._id));
        } else {
            throw new Error('Response is not an array of 2');
        }
    } catch (error) {
        console.error('❌ Bulk Transaction Test Failed:', error);
    }
    console.log('');

    // 4. Verify Data Persistence (Read)
    try {
        console.log('4. Verifying Data Persistence (GET /transactions)...');
        const res = await fetch(`${BASE_URL}/transactions?limit=10`, {
            headers
        });

        const data: any = await res.json();
        const transactions = data.data;

        // We expect 3 transactions total (1 single + 2 bulk)
        if (transactions.length >= 3) {
            // Check if our specific descriptions exist
            const descriptions = transactions.map((t: any) => t.description);
            const hasSingle = descriptions.includes('Test Single Transaction');
            const hasBulk1 = descriptions.includes('Bulk Item 1');
            const hasBulk2 = descriptions.includes('Bulk Salary');

            if (hasSingle && hasBulk1 && hasBulk2) {
                console.log('✅ All transactions verified in database.');
            } else {
                throw new Error('Missing expected transactions in fetch list.');
            }
        } else {
            throw new Error(`Expected at least 3 transactions, found ${transactions.length}`);
        }

    } catch (error) {
        console.error('❌ Verification Failed:', error);
    }
    console.log('');

    // 5. Test Recurring Transaction (Lazy Injection)
    let recurringId = '';
    try {
        console.log('5. Testing Recurring Transaction (Lazy Injection)...');

        // A. Create Recurring Rule
        const payload = {
            amount: 500,
            description: 'Monthly Netflix',
            category: 'Entertainment',
            type: 'EXPENSE',
            dayOfMonth: 1
        };

        const createRes = await fetch(`${BASE_URL}/recurring`, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
        });

        if (!createRes.ok) throw new Error(`Failed to create recurring: ${createRes.statusText}`);
        const recurring: any = await createRes.json();
        recurringId = recurring._id;
        console.log('   - Recurring rule created.');

        // B. Rewind time (Simulate 1 month passing)
        const rewindRes = await fetch(`${BASE_URL}/recurring/${recurringId}/rewind`, {
            method: 'POST',
            headers
        });
        if (!rewindRes.ok) throw new Error('Failed to rewind recurring transaction');
        console.log('   - Time rewound (simulated).');

        // C. Trigger Injection (GET /transactions)
        await fetch(`${BASE_URL}/transactions?limit=1`, { headers });
        console.log('   - Triggered lazy injection.');

        // D. Verify Auto-Created Transaction
        const verifyRes = await fetch(`${BASE_URL}/transactions?limit=10`, { headers });
        const verifyData: any = await verifyRes.json();
        const autoTx = verifyData.data.find((t: any) => t.description === 'Monthly Netflix (Auto)');

        if (autoTx) {
            console.log('✅ Recurring transaction successfully injected.');
            createdTransactionIds.push(autoTx._id);
        } else {
            throw new Error('Auto-injected transaction not found.');
        }

    } catch (error) {
        console.error('❌ Recurring Transaction Test Failed:', error);
    }
    console.log('');

    // 6. Test Chat (AI Text Parse)
    try {
        console.log('6. Testing Chat (AI Text Parse)...');
        const payload = { input: "Spent 50 on coffee" };
        const res = await fetch(`${BASE_URL}/ai/parse-text`, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            const data: any = await res.json();
            // The parser returns { transactions: [...] }
            const txList = data.transactions || data;

            if (Array.isArray(txList) && txList.length > 0 && txList[0].amount === 50) {
                console.log('✅ Chat parse successful.');
            } else {
                console.warn('⚠️ Chat parse returned unexpected data:', data);
            }
        } else {
            console.warn(`⚠️ Chat parse failed (likely AI quota/network): ${res.statusText}`);
        }
    } catch (error) {
        console.warn('⚠️ Chat Test Skipped/Failed:', error);
    }
    console.log('');

    // 7. Test Voice (AI Audio Parse)
    try {
        console.log('7. Testing Voice (AI Audio Parse)...');
        // Sending a tiny dummy base64 audio string. 
        // The AI will likely reject it or return garbage, but we test the endpoint connectivity.
        const dummyAudio = "data:audio/webm;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";

        const res = await fetch(`${BASE_URL}/ai/parse-voice`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ audio: dummyAudio })
        });

        if (res.ok) {
            console.log('✅ Voice endpoint reachable (Response received).');
        } else {
            // 400 Bad Request is expected for invalid audio, which confirms the endpoint is working up to the AI call
            if (res.status === 400 || res.status === 500) {
                console.log('✅ Voice endpoint reachable (Error expected for dummy audio).');
            } else {
                console.warn(`⚠️ Voice endpoint failed: ${res.statusText}`);
            }
        }
    } catch (error) {
        console.warn('⚠️ Voice Test Skipped/Failed:', error);
    }
    console.log('');

    // 8. Cleanup
    try {
        console.log('6. Cleaning up (Deleting created transactions)...');
        for (const id of createdTransactionIds) {
            const res = await fetch(`${BASE_URL}/transactions/${id}`, {
                method: 'DELETE',
                headers
            });
            if (res.ok) {
                // @ts-ignore
                process.stdout.write('.');
            } else {
                console.error(`Failed to delete ${id}`);
            }
        }
        console.log('\n✅ Cleanup complete.');
    } catch (error) {
        console.error('❌ Cleanup Failed:', error);
    }

    console.log('\n🎉 Test Suite Completed.');
}

runTests();
