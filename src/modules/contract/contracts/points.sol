// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity 0.8.22;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./ribbonVault.sol";
contract points is ERC20,Ownable{

    struct vaultId{
        address vaultAdrress;
        string  name;  
    }
    uint public counterId=1;
    mapping (string =>bool) nameVault;
    mapping (uint=>vaultId)public vaultIdentifcation;
    mapping (address=>bool)approveToBurn;
    
    constructor()ERC20("Points","PNT")Ownable(msg.sender){
       _mint(msg.sender,10000000000*10**18);
    }

    function mint(address add,uint amount)public onlyOwner{
        _mint(add,amount);
    }
    function burn(address account, uint256 value)public {
        require(approveToBurn[msg.sender] == true, "you are not approved to burn");
        _burn( account, value);
    }

    function setApproveToburn(address approvedAdd, bool _approve)external onlyOwner {
              _setApproveToburn(approvedAdd, _approve);
    }
    function _setApproveToburn(address approvedAdd, bool _approve)internal {
              approveToBurn[approvedAdd]=_approve;
    }

    function createVault(string memory vaultName, address vaultowner,address paymentAddress,uint pointsAmountForVault)public onlyOwner returns(vaultId memory){
         vaultId storage _vaultid =  vaultIdentifcation[counterId];
         require(nameVault[vaultName]==false, "name taken");
         nameVault[vaultName]= true;
          vault _vault =new vault(vaultowner,vaultName,paymentAddress,address(this));
         _vaultid.vaultAdrress =address(_vault);
         _vaultid.name=vaultName;
        // vaultIdentifcation[counterId]=_vaultid;
        _mint(address(_vault),pointsAmountForVault);
         counterId++;
         _setApproveToburn(address(_vault) , true);
         return _vaultid;
    }

    
}