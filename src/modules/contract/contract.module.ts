import { Module } from '@nestjs/common';
import Vault from './abis/VaultABI.json';
import Point from './abis/PointsABI.json';
import { POINT, VAULT } from '@/core/constants';
import { ContractService } from './contract.service';

const VaultProvider = { provide: VAULT, useValue: Vault };
const PointProvider = { provide: POINT, useValue: Point };

@Module({ exports: [ContractService], providers: [ContractService, VaultProvider, PointProvider] })
export class ContractModule {}
