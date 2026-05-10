import test from 'node:test';
import assert from 'node:assert/strict';
import { authMiddleware, clearAuthCookie, generateToken, setAuthCookie, verifyToken } from '../src/auth.js';

const makeRes = () => ({
  statusCode: 200,
  body: null,
  cookieArgs: null,
  clearCookieArgs: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(payload) {
    this.body = payload;
    return this;
  },
  cookie(...args) {
    this.cookieArgs = args;
  },
  clearCookie(...args) {
    this.clearCookieArgs = args;
  }
});

test('generateToken returns a token string', () => {
  const token = generateToken(42);

  assert.equal(typeof token, 'string');
  assert.ok(token.length > 20);
});

test('verifyToken decodes a valid token payload', () => {
  const token = generateToken(7);
  const decoded = verifyToken(token);

  assert.equal(decoded.userId, 7);
});

test('verifyToken returns null for an invalid token', () => {
  assert.equal(verifyToken('not-a-token'), null);
});

test('verifyToken returns null for an empty token', () => {
  assert.equal(verifyToken(''), null);
});

test('authMiddleware rejects missing tokens', () => {
  const req = { cookies: {} };
  const res = makeRes();
  let nextCalled = false;

  authMiddleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.body, { error: 'Unauthorized' });
  assert.equal(nextCalled, false);
});

test('authMiddleware rejects invalid tokens', () => {
  const req = { cookies: { token: 'invalid' } };
  const res = makeRes();
  let nextCalled = false;

  authMiddleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.body, { error: 'Invalid or expired token' });
  assert.equal(nextCalled, false);
});

test('authMiddleware allows valid tokens and attaches userId', () => {
  const req = { cookies: { token: generateToken(99) } };
  const res = makeRes();
  let nextCalled = false;

  authMiddleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(res.statusCode, 200);
  assert.equal(req.userId, 99);
  assert.equal(nextCalled, true);
});

test('setAuthCookie writes the auth token cookie', () => {
  const res = makeRes();
  setAuthCookie(res, 'abc123');

  assert.deepEqual(res.cookieArgs[0], 'token');
  assert.equal(res.cookieArgs[1], 'abc123');
  assert.equal(res.cookieArgs[2].httpOnly, true);
  assert.equal(res.cookieArgs[2].path, '/');
});

test('clearAuthCookie clears the auth cookie', () => {
  const res = makeRes();
  clearAuthCookie(res);

  assert.deepEqual(res.clearCookieArgs[0], 'token');
  assert.equal(res.clearCookieArgs[1].httpOnly, true);
  assert.equal(res.clearCookieArgs[1].path, '/');
});