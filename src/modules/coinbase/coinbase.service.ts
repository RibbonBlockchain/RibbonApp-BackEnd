import { go } from '@/core/utils';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Coinbase, Wallet } from '@coinbase/coinbase-sdk';
import { AssetTransfersCategory, AssetTransfersOrder, createAlchemyWeb3 } from '@alch/alchemy-web3';

@Injectable()
export class CoinbaseService {
  private readonly CONTRACT_RPC = this.config.getOrThrow('CONTRACT_RPC');
  private readonly CONTRACT_RPC_V2 = this.config.getOrThrow('CONTRACT_RPC_V2');
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

  async transactions(privateKey: string) {
    return await go(async () => {
      const data = JSON.parse(atob(privateKey));

      console.log(data);

      const wallet = await Wallet.import(data);
      const address = await wallet?.getDefaultAddress();

      const web3 = createAlchemyWeb3(this.CONTRACT_RPC);

      const out = await web3.alchemy.getAssetTransfers({
        maxCount: 10,
        withMetadata: true,
        fromAddress: address.getId(),
        order: AssetTransfersOrder.DESCENDING,
        category: [AssetTransfersCategory.EXTERNAL, AssetTransfersCategory.ERC20, AssetTransfersCategory.ERC721],
      } as any);

      const inb = await web3.alchemy.getAssetTransfers({
        maxCount: 10,
        withMetadata: true,
        toAddress: address.getId(),
        order: AssetTransfersOrder.DESCENDING,
        category: [AssetTransfersCategory.EXTERNAL, AssetTransfersCategory.ERC20],
      } as any);

      return { in: inb, out };
    });
  }

  async allBaseTransactions(address: string) {
    return await go(async () => {
      const web3 = createAlchemyWeb3(this.CONTRACT_RPC_V2);

      const out = await web3.alchemy.getAssetTransfers({
        maxCount: 10,
        withMetadata: true,
        fromAddress: address,
        order: AssetTransfersOrder.DESCENDING,
        category: [AssetTransfersCategory.EXTERNAL, AssetTransfersCategory.ERC20, AssetTransfersCategory.ERC721],
      } as any);

      const inb = await web3.alchemy.getAssetTransfers({
        maxCount: 10,
        toAddress: address,
        withMetadata: true,
        order: AssetTransfersOrder.DESCENDING,
        category: [AssetTransfersCategory.EXTERNAL, AssetTransfersCategory.ERC20],
      } as any);

      return { in: inb, out };
    });
  }

  async allOptimismTransactions(address: string) {
    return await go(async () => {
      const web3 = createAlchemyWeb3(this.CONTRACT_RPC);

      const out = await web3.alchemy.getAssetTransfers({
        maxCount: 10,
        withMetadata: true,
        fromAddress: address,
        order: AssetTransfersOrder.DESCENDING,
        category: [AssetTransfersCategory.EXTERNAL, AssetTransfersCategory.ERC20, AssetTransfersCategory.ERC721],
      } as any);

      const inb = await web3.alchemy.getAssetTransfers({
        maxCount: 10,
        toAddress: address,
        withMetadata: true,
        order: AssetTransfersOrder.DESCENDING,
        category: [AssetTransfersCategory.EXTERNAL, AssetTransfersCategory.ERC20],
      } as any);

      return { in: inb, out };
    });
  }
}
