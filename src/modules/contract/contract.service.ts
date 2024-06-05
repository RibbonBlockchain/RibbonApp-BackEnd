import { ethers } from 'ethers';
import { ConfigService } from '@nestjs/config';
import { POINT, VAULT } from '@/core/constants';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class ContractService {
  private readonly rpc = this.config.getOrThrow('CONTRACT_RPC');
  private readonly pointAddress = this.config.getOrThrow('POINT_WALLET_ADDRESS');
  private readonly vaultAddress = this.config.getOrThrow('VAULT_WALLET_ADDRESS');
  private readonly contractPrivateKey = this.config.getOrThrow('CONTRACT_PRIVATE_KEY');

  private readonly provider = new ethers.providers.JsonRpcProvider(this.rpc);
  private readonly signer = new ethers.Wallet(this.contractPrivateKey, this.provider);

  private readonly Vault = () => new ethers.Contract(this.vaultAddress, this.VaultABI, this.provider);
  private readonly pointsContract = () => new ethers.Contract(this.pointAddress, this.PointsABI, this.provider);

  constructor(
    private readonly config: ConfigService,
    @Inject(VAULT) private readonly VaultABI: any,
    @Inject(POINT) private readonly PointsABI: any,
  ) {}

  async createVault(name: string) {
    const contract0 = this.pointsContract();

    let i = contract0.counterId();
    console.log(i, 'counter');

    const result = await contract0.connect(this.signer).createVault(name, this.vaultAddress);
    const receipt = await result.wait();
    console.log(receipt);

    let vaultDetails = contract0.vaultIdentifcation(i);
    console.log(vaultDetails, 'vaultDetails');
  }

  async claimPoints(address: string, intAmount: any) {
    const contract1 = this.Vault();

    const amount = ethers.utils.parseUnits(String(intAmount));
    const result = await contract1.connect(this.signer).claimPoints(address, amount);

    const receipt = await result.wait();
    console.log(receipt);
    console.log('pointsclaimed');
  }

  async swapToPaymentCoin(address: string, intAmount: any) {
    const contract1 = this.Vault();

    const amount = ethers.utils.parseUnits(String(intAmount));
    const result = await contract1.connect(this.signer).swapToPaymentCoin(address, amount);
    const receipt = await result.wait();
    console.log(receipt);
    console.log('worldcoinclaimed');
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
