// src/app/api/getAccessToken/route.ts
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import axios from 'axios';

const APP_KEY = process.env.APP_KEY as string;
const APP_SECRET = process.env.APP_SECRET as string;

// Cache variables
let cachedToken: string | null = null;
let tokenExpiryTime: number = 0;
let cachedNonce: string | null = null;
let cachedTimestamp: string | null = null;
let cachedSignature: string | null = null;

function generateSignature(appKey: string, nonce: string, timeStamp: string, appSecret: string): string {
    const params = { appKey, nonce, timeStamp };
    const sortedParams = Object.keys(params)
        .sort()
        .map(key => `${key}=${params[key as keyof typeof params]}`)
        .join('&');
    const stringToSign = sortedParams + appSecret;
    return crypto.createHash('sha256').update(stringToSign).digest('hex');
}

export async function POST() {
    const currentTime = Date.now();

    // Check if the token is valid
    if (cachedToken && currentTime < tokenExpiryTime) {
        return NextResponse.json({
            code: 0,
            success: true,
            msg: 'Token fetched from cache',
            data: { access_token: cachedToken, expires_in: tokenExpiryTime },
            app_key: APP_KEY,
            nonce: cachedNonce,
            timestamp: cachedTimestamp,
            signature: cachedSignature,
        });
    }

    const nonce = crypto.randomBytes(16).toString('hex');
    const timeStamp = currentTime.toString();
    const signature = generateSignature(APP_KEY, nonce, timeStamp, APP_SECRET);

    try {
        const response = await axios.post(
            'https://edith.xiaohongshu.com/api/sns/v1/ext/access/token',
            {
                app_key: APP_KEY,
                nonce: nonce,
                timestamp: timeStamp,
                signature: signature,
            },
            {
                headers: { 'Content-Type': 'application/json' },
            }
        );

        const data = response.data;
        if (data.success) {
            cachedToken = data.data.access_token;
            tokenExpiryTime = data.data.expires_in;
            cachedNonce = nonce;
            cachedSignature = generateSignature(APP_KEY, nonce, timeStamp, cachedToken as string);;
            cachedTimestamp = timeStamp;

            return NextResponse.json({
                code: 0,
                success: true,
                msg: 'New token fetched',
                data: data.data,
                app_key: APP_KEY,
                nonce: nonce,
                timestamp: timeStamp,
                signature: cachedSignature,
            });
        } else {
            return NextResponse.json(
                { error: data.msg || 'Failed to fetch token' },
                { status: 400 }
            );
        }
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error occurred' },
            { status: 500 }
        );
    }
}