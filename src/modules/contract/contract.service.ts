import { ethers } from 'ethers';
import { ConfigService } from '@nestjs/config';
import { POINT, VAULT } from '@/core/constants';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';

@Injectable()
export class ContractService {
  private readonly rpc = this.config.getOrThrow('CONTRACT_RPC');
  private readonly vaultOwner = this.config.getOrThrow('VAULT_OWNER');
  private readonly pointAddress = this.config.getOrThrow('POINT_WALLET_ADDRESS');
  private readonly contractPrivateKey = this.config.getOrThrow('CONTRACT_PRIVATE_KEY');

  private readonly provider = new ethers.providers.JsonRpcProvider(this.rpc);
  private readonly signer = new ethers.Wallet(this.contractPrivateKey, this.provider);

  private readonly pointsContract = () => new ethers.Contract(this.pointAddress, this.PointsABI, this.provider);

  constructor(
    private readonly config: ConfigService,
    @Inject(VAULT) private readonly VaultABI: any,
    @Inject(POINT) private readonly PointsABI: any,
  ) {}

  async createVault(body: { name: string; address: string; points: number }) {
    try {
      const contract0 = await this.pointsContract();

      let i = await contract0.counterId();

      const result = await contract0
        .connect(this.signer)
        .createVault(body.name, this.vaultOwner, body.address, String(body.points));

      console.log('res', result);

      const aw = await result.wait();

      console.log('aw', aw);

      let vaultDetails = await contract0.vaultIdentifcation(i);
      return { vaultAddress: vaultDetails?.[0] };
    } catch (error) {
      console.log(error);
      let message = error?.error?.reason || error?.reason || 'Unable to process request';
      throw new BadRequestException(message || error?.reason);
    }
  }

  async claimPoints(address: string, intAmount: any, vaultAddress: string) {
    try {
      const Vault = () => new ethers.Contract(vaultAddress, this.VaultABI, this.provider);

      const contract1 = Vault();

      const amount = ethers.utils.parseUnits(String(intAmount));
      const result = await contract1.connect(this.signer).claimPoints(address, amount);

      // limit amount to 10_000
      await result.wait();
      return {};
    } catch (error) {
      console.log(error);
      let message = error?.error?.reason || error?.reason || 'Unable to process request';
      throw new BadRequestException(message || error?.reason);
    }
  }

  async swapToPaymentCoin(address: string, intAmount: any, vaultAddress: string) {
    try {
      const Vault = () => new ethers.Contract(vaultAddress, this.VaultABI, this.provider);

      const contract1 = Vault();

      const amount = ethers.utils.parseUnits(String(intAmount));
      const result = await contract1.connect(this.signer).swapToPaymentCoin(address, amount);
      await result.wait();

      return {};
    } catch (error) {
      console.log(error);
      let message = error?.error?.reason || error?.reason || 'Unable to process request';
      throw new BadRequestException(message || error?.reason);
    }
  }

  async mint(address: string, intAmount: any) {
    const contract0 = this.pointsContract();

    let i = contract0.counterId();
    console.log(i, 'counter');

    const amount = ethers.utils.parseUnits(String(intAmount));

    const result = await contract0.connect(this.signer).mint(address, amount);
    const receipt = await result.wait();
    console.log(receipt);
  }
}

// {
//   to: '0xe050A5B250919d0c552085DF16f71c1716079821',
//   from: '0xe050A5B250919d0c552085DF16f71c1716079821',
//   contractAddress: null,
//   transactionIndex: 1,
//   gasUsed: BigNumber { _hex: '0x5498', _isBigNumber: true },
//   logsBloom: '0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
//   blockHash: '0x94452f92d82526b42a11b7d383120bfe77479c34ad1a622beb58177cf80be948',
//   transactionHash: '0x1256e35c479f40739f154b22406175f9ed86b0f0c316ad32bc0eb518638a2693',
//   logs: [],
//   blockNumber: 12907603,
//   confirmations: 1,
//   cumulativeGasUsed: BigNumber { _hex: '0x01209b', _isBigNumber: true },
//   effectiveGasPrice: BigNumber { _hex: '0x5968300b', _isBigNumber: true },
//   status: 1,
//   type: 2,
//   byzantium: true,
//   events: []
// }

// {
//   to: '0xf3b5E5fEE488840C40a8c5C6E83b471e1F59B1e1',
//   from: '0xe050A5B250919d0c552085DF16f71c1716079821',
//   contractAddress: null,
//   transactionIndex: 1,
//   gasUsed: BigNumber { _hex: '0xfaf2', _isBigNumber: true },
//   logsBloom: '0x00000000040000000200000000000000000000000000000010000000000000080000000000080000000000000000000000000000000000000000000000020000000000000000000000000008000000000000000000000000400000000000000000000000000000000000000200000000000000000000000000000010000000000000000000000000000000000000200000000000000000800000000100000000000000000000000000000000002000000000000000000000000000000000004000000002000000000000000000000000000000000000000000000004000004000000000000000000000000000000000000000000000000000000000000000000',
//   blockHash: '0x99c6d33a87ea268ecd2d113bca2d8e92f5dd5c0bbe42c528b0102bf58f9657a1',
//   transactionHash: '0xe6db585fbf61484ad987d2787a26cf6e4f8946a31a5552c4debd18269505bee4',
//   logs: [
//     {
//       transactionIndex: 1,
//       blockNumber: 12907875,
//       transactionHash: '0xe6db585fbf61484ad987d2787a26cf6e4f8946a31a5552c4debd18269505bee4',
//       address: '0x004E9b9c6Ff44ccd0c2bD12addB9b9C56E893E62',
//       topics: [Array],
//       data: '0x00000000000000000000000000000000000000000000021e19e0c9bab2400000',
//       logIndex: 0,
//       blockHash: '0x99c6d33a87ea268ecd2d113bca2d8e92f5dd5c0bbe42c528b0102bf58f9657a1'
//     },
//     {
//       transactionIndex: 1,
//       blockNumber: 12907875,
//       transactionHash: '0xe6db585fbf61484ad987d2787a26cf6e4f8946a31a5552c4debd18269505bee4',
//       address: '0xf3b5E5fEE488840C40a8c5C6E83b471e1F59B1e1',
//       topics: [Array],
//       data: '0x00000000000000000000000015d34aaf54267db7d7c367839aaf71a00a2c6a6500000000000000000000000000000000000000000000021e19e0c9bab2400000',
//       logIndex: 1,
//       blockHash: '0x99c6d33a87ea268ecd2d113bca2d8e92f5dd5c0bbe42c528b0102bf58f9657a1'
//     }
//   ],
//   blockNumber: 12907875,
//   confirmations: 1,
//   cumulativeGasUsed: BigNumber { _hex: '0x01a631', _isBigNumber: true },
//   effectiveGasPrice: BigNumber { _hex: '0x59683007', _isBigNumber: true },
//   status: 1,
//   type: 2,
//   byzantium: true,
//   events: [
//     {
//       transactionIndex: 1,
//       blockNumber: 12907875,
//       transactionHash: '0xe6db585fbf61484ad987d2787a26cf6e4f8946a31a5552c4debd18269505bee4',
//       address: '0x004E9b9c6Ff44ccd0c2bD12addB9b9C56E893E62',
//       topics: [Array],
//       data: '0x00000000000000000000000000000000000000000000021e19e0c9bab2400000',
//       logIndex: 0,
//       blockHash: '0x99c6d33a87ea268ecd2d113bca2d8e92f5dd5c0bbe42c528b0102bf58f9657a1',
//       removeListener: [Function (anonymous)],
//       getBlock: [Function (anonymous)],
//       getTransaction: [Function (anonymous)],
//       getTransactionReceipt: [Function (anonymous)]
//     },
//     {
//       transactionIndex: 1,
//       blockNumber: 12907875,
//       transactionHash: '0xe6db585fbf61484ad987d2787a26cf6e4f8946a31a5552c4debd18269505bee4',
//       address: '0xf3b5E5fEE488840C40a8c5C6E83b471e1F59B1e1',
//       topics: [Array],
//       data: '0x00000000000000000000000015d34aaf54267db7d7c367839aaf71a00a2c6a6500000000000000000000000000000000000000000000021e19e0c9bab2400000',
//       logIndex: 1,
//       blockHash: '0x99c6d33a87ea268ecd2d113bca2d8e92f5dd5c0bbe42c528b0102bf58f9657a1',
//       args: [Array],
//       decode: [Function (anonymous)],
//       event: 'PointsClaimed',
//       eventSignature: 'PointsClaimed(address,uint256)',
//       removeListener: [Function (anonymous)],
//       getBlock: [Function (anonymous)],
//       getTransaction: [Function (anonymous)],
//       getTransactionReceipt: [Function (anonymous)]
//     }
//   ]
// }

// Error: cannot estimate gas; transaction may fail or may require manual gas limit [ See: https://links.ethers.org/v5-errors-UNPREDICTABLE_GAS_LIMIT ] (error={"reason":"execution reverted: points to swap less than minpoints","code":"UNPREDICTABLE_GAS_LIMIT","method":"estimateGas","transaction":{"from":"0xe050A5B250919d0c552085DF16f71c1716079821","maxPriorityFeePerGas":{"type":"BigNumber","hex":"0x59682f00"},"maxFeePerGas":{"type":"BigNumber","hex":"0x59683116"},"to":"0xf3b5E5fEE488840C40a8c5C6E83b471e1F59B1e1","data":"0x34ef077c00000000000000000000000015d34aaf54267db7d7c367839aaf71a00a2c6a6500000000000000000000000000000000000000000000010f0cf064dd59200000","type":2,"accessList":null},"error":{"reason":"processing response error","code":"SERVER_ERROR","body":"{\"jsonrpc\":\"2.0\",\"id\":99,\"error\":{\"code\":3,\"message\":\"execution reverted: points to swap less than minpoints\",\"data\":\"0x08c379a000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000022706f696e747320746f2073776170206c657373207468616e206d696e706f696e7473000000000000000000000000000000000000000000000000000000000000\"}}","error":{"code":3,"data":"0x08c379a000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000022706f696e747320746f2073776170206c657373207468616e206d696e706f696e7473000000000000000000000000000000000000000000000000000000000000"},"requestBody":"{\"method\":\"eth_estimateGas\",\"params\":[{\"type\":\"0x2\",\"maxFeePerGas\":\"0x59683116\",\"maxPriorityFeePerGas\":\"0x59682f00\",\"from\":\"0xe050a5b250919d0c552085df16f71c1716079821\",\"to\":\"0xf3b5e5fee488840c40a8c5c6e83b471e1f59b1e1\",\"data\":\"0x34ef077c00000000000000000000000015d34aaf54267db7d7c367839aaf71a00a2c6a6500000000000000000000000000000000000000000000010f0cf064dd59200000\"}],\"id\":99,\"jsonrpc\":\"2.0\"}","requestMethod":"POST","url":"https://opt-sepolia.g.alchemy.com/v2/fw6todGL-HqWdvvhbGrx_nXxROeQQIth"}}, tx={"data":"0x34ef077c00000000000000000000000015d34aaf54267db7d7c367839aaf71a00a2c6a6500000000000000000000000000000000000000000000010f0cf064dd59200000","to":{},"from":"0xe050A5B250919d0c552085DF16f71c1716079821","type":2,"maxFeePerGas":{"type":"BigNumber","hex":"0x59683116"},"maxPriorityFeePerGas":{"type":"BigNumber","hex":"0x59682f00"},"nonce":{},"gasLimit":{},"chainId":{}}, code=UNPREDICTABLE_GAS_LIMIT, version=abstract-signer/5.7.0)

// Error: cannot estimate gas; transaction may fail or may require manual gas limit [ See: https://links.ethers.org/v5-errors-UNPREDICTABLE_GAS_LIMIT ] (error={"reason":"execution reverted","code":"UNPREDICTABLE_GAS_LIMIT","method":"estimateGas","transaction":{"from":"0xe050A5B250919d0c552085DF16f71c1716079821","maxPriorityFeePerGas":{"type":"BigNumber","hex":"0x59682f00"},"maxFeePerGas":{"type":"BigNumber","hex":"0x59683114"},"to":"0xf3b5E5fEE488840C40a8c5C6E83b471e1F59B1e1","data":"0x966addc000000000000000000000000015d34aaf54267db7d7c367839aaf71a00a2c6a6500000000000000000000000000000000000000000000021e19e0c9bab2400000","type":2,"accessList":null},"error":{"reason":"processing response error","code":"SERVER_ERROR","body":"{\"jsonrpc\":\"2.0\",\"id\":91,\"error\":{\"code\":-32000,\"message\":\"execution reverted\"}}","error":{"code":-32000},"requestBody":"{\"method\":\"eth_estimateGas\",\"params\":[{\"type\":\"0x2\",\"maxFeePerGas\":\"0x59683114\",\"maxPriorityFeePerGas\":\"0x59682f00\",\"from\":\"0xe050a5b250919d0c552085df16f71c1716079821\",\"to\":\"0xf3b5e5fee488840c40a8c5c6e83b471e1f59b1e1\",\"data\":\"0x966addc000000000000000000000000015d34aaf54267db7d7c367839aaf71a00a2c6a6500000000000000000000000000000000000000000000021e19e0c9bab2400000\"}],\"id\":91,\"jsonrpc\":\"2.0\"}","requestMethod":"POST","url":"https://opt-sepolia.g.alchemy.com/v2/fw6todGL-HqWdvvhbGrx_nXxROeQQIth"}}, tx={"data":"0x966addc000000000000000000000000015d34aaf54267db7d7c367839aaf71a00a2c6a6500000000000000000000000000000000000000000000021e19e0c9bab2400000","to":{},"from":"0xe050A5B250919d0c552085DF16f71c1716079821","type":2,"maxFeePerGas":{"type":"BigNumber","hex":"0x59683114"},"maxPriorityFeePerGas":{"type":"BigNumber","hex":"0x59682f00"},"nonce":{},"gasLimit":{},"chainId":{}}, code=UNPREDICTABLE_GAS_LIMIT, version=abstract-signer/5.7.0)
