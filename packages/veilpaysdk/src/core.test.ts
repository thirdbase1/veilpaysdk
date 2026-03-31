import { test, describe } from 'node:test';
import assert from 'node:assert';
import { VeilPayCoFHE, setGlobalClientForTesting, setGlobalIsReadyForTesting } from '../dist/core.js';
import { VeilPayEncryptionError } from '../dist/errors.js';

describe('VeilPayCoFHE encryptAmount', () => {
  test('Successful encryption - converts amount correctly', async () => {
    const sdk = new VeilPayCoFHE();

    let capturedWei = null;
    const mockClient = {
      encryptUint128: async (wei) => {
        capturedWei = wei;
        return {
          ctHash: 'hash',
          securityZone: 1,
          utype: 2,
          signature: 'sig'
        };
      }
    };

    setGlobalClientForTesting(mockClient);
    setGlobalIsReadyForTesting(true);

    const result = await sdk.encryptAmount(1.23, 6);

    assert.strictEqual(capturedWei, 1230000n);
    assert.deepStrictEqual(result, {
      ctHash: 'hash',
      securityZone: 1,
      utype: 2,
      signature: 'sig'
    });
  });

  test('Engine Offline Error handling', async () => {
    const sdk = new VeilPayCoFHE();

    setGlobalClientForTesting(null);
    setGlobalIsReadyForTesting(true);

    try {
      await sdk.encryptAmount(100);
      assert.fail('Should have thrown an error');
    } catch (error) {
      assert.ok(error instanceof VeilPayEncryptionError);
      assert.strictEqual(error.message, '[VeilPay SDK] Engine Offline.');
    }
  });

  test('Incomplete KMS struct Error handling', async () => {
    const sdk = new VeilPayCoFHE();

    const mockClient = {
      encryptUint128: async () => {
        return {
          ctHash: 'hash'
          // missing other fields
        };
      }
    };

    setGlobalClientForTesting(mockClient);
    setGlobalIsReadyForTesting(true);

    try {
      await sdk.encryptAmount(100);
      assert.fail('Should have thrown an error');
    } catch (error) {
      assert.ok(error instanceof VeilPayEncryptionError);
      assert.strictEqual(error.message, '[VeilPay SDK] Incomplete KMS struct.');
    }
  });
});
