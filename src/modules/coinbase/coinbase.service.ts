import { go } from '@/core/utils';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Coinbase, Wallet } from '@coinbase/coinbase-sdk';

@Injectable()
export class CoinbaseService {
  private readonly COINBASE_API_KEY = this.config.getOrThrow('COINBASE_API_KEY');
  private readonly COINBASE_PRIVATE_KEY = this.config.getOrThrow('COINBASE_PRIVATE_KEY')?.replaceAll('\\n', '\n');

  constructor(private readonly config: ConfigService) {}

  async createWallet() {
    return await go(async () => {
      Coinbase.configure({
        apiKeyName: this.COINBASE_API_KEY,
        privateKey: this.COINBASE_PRIVATE_KEY,
      });

      const userWallet = await Wallet.create();
      const address = userWallet.getDefaultAddress();
      const privateKey = userWallet.export();

      return { address, privateKey };
    });
  }

  async transfer(body: { address: string; amount: number; privateKey: string }) {
    return await go(async () => {
      Coinbase.configure({
        apiKeyName: this.COINBASE_API_KEY,
        privateKey: this.COINBASE_PRIVATE_KEY,
      });

      const data = JSON.parse(atob(body.privateKey));
      const wallet = await Wallet.import(data);

      const transfer = await wallet?.createTransfer({
        gasless: true,
        amount: body.amount,
        destination: body.address,
        assetId: Coinbase.assets.Usdc,
      });

      return {
        transactionLink: transfer?.getTransactionLink(),
        hash: transfer?.getTransactionHash()?.substring(0, 10),
      };
    });
  }

  async getBalance(privateKey: string) {
    return await go(async () => {
      Coinbase.configure({
        apiKeyName: this.COINBASE_API_KEY,
        privateKey: this.COINBASE_PRIVATE_KEY,
      });

      const data = JSON.parse(atob(privateKey));
      const wallet = await Wallet.import(data);
      const balance = await wallet.getBalance(Coinbase.assets.Usdc);
      return balance.toNumber();
    });
  }

  async listTransactions(privateKey: string) {
    return await go(async () => {
      Coinbase.configure({
        apiKeyName: this.COINBASE_API_KEY,
        privateKey: this.COINBASE_PRIVATE_KEY,
      });

      const data = JSON.parse(atob(privateKey));
      const wallet = await Wallet.import(data);
      const address = await wallet?.getDefaultAddress();
      return await address.listTransactions();
    });
  }
}
