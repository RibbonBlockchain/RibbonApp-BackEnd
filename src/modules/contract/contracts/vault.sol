// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity 0.8.22;
import "@openzeppelin/contracts/access/Ownable.sol";

interface IERC20T {
    function decimals()external view returns (uint8);

    function balanceOf(address account) external view returns (uint256);

   
    function transfer(address to, uint256 value) external returns (bool);
    function burn(address account, uint256 value)external;

 
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}

contract vault is Ownable{
  IERC20T _Ipaymentcoin;
  IERC20T _Ipointscoin;
  uint public depositFee;
  uint public rate;
  uint public withdrawalFee;
  uint public pointsMin;
  uint public initContractBalancePaymentCoin;
  uint public claimedPaymentCoin;
  uint public TotalfeescollectedPaymentCoin;
  string public vaultName;
  mapping (address=>bool) public onlyApprovedAdmin;
  event swap(address user,uint pointToSwap,uint paymentTokenRecieved,uint _fees);
  event PointsClaimed(address user,uint amount);

  constructor(address owner,string memory name,address paymentAddress,address pointsaddress)Ownable(owner){
        vaultName=name;
        depositFee =10;
        rate = 5000;
        pointsMin = 10000*10**18;
        _Ipaymentcoin = IERC20T(paymentAddress);
        _Ipointscoin = IERC20T(pointsaddress);
        onlyApprovedAdmin[owner]=true;
  }

  // @dev set fee  without decimal 
  function setpaymentTokenAndpoints(address paymentAddress,address pointsaddress)public onlyOwner{
       _Ipaymentcoin = IERC20T(paymentAddress);
       _Ipointscoin = IERC20T(pointsaddress);
  }



  function setPaymentDepositfees(uint _fee)public onlyOwner{
       depositFee = _fee;
  }
  function setWithdrawalFee(uint _fee)public onlyOwner{
       withdrawalFee = _fee;
  }
  // @dev set _rate  without decimal 
  function setRate(uint _rate)public onlyOwner{
         rate = _rate;
  }
   // @dev set _rate  without decimal 
  function setMinPointsToSWap(uint _pointsMin)public onlyOwner{
         pointsMin = _pointsMin*10**18;
  }
   function setApprovedAdmin(address[] memory _addresses,bool _val)public onlyOwner{ 
        for(uint i=0;i<_addresses.length;i++){
           onlyApprovedAdmin[_addresses[i]]=_val;
        }
  }

   function withdrawfees(address feeTakerAddress) public onlyOwner{
       uint contractBalance =_Ipaymentcoin.balanceOf(address(this));
       uint balanceDeposited = (contractBalance + claimedPaymentCoin + TotalfeescollectedPaymentCoin) - initContractBalancePaymentCoin;
       initContractBalancePaymentCoin += balanceDeposited;
       uint _fee = (balanceDeposited*depositFee)/100;
       TotalfeescollectedPaymentCoin += _fee;
       _Ipaymentcoin.transfer(feeTakerAddress,_fee);
  }


//   function withdrawfees(address feeTakerAddress) public onlyOwner{
//        uint contractBalance =_Ipaymentcoin.balanceOf(address(this));
//        uint _fee = (contractBalance*depositFee)/100;
//        _Ipaymentcoin.transfer(feeTakerAddress,_fee);
//   }

  function claimPoints(address user,uint amount)public  {
     require(onlyApprovedAdmin[msg.sender]==true,"you are not permitted");
          require(amount >= pointsMin);
          _Ipointscoin.transfer(user,amount);
       emit   PointsClaimed(user,amount);
  }
  
  function checkAmountToRecive(uint pointToSwap)public view returns(uint){
          uint _rate = (pointToSwap * 1*10**_Ipaymentcoin.decimals())/(rate*10**18);
          return _rate;
  }

   // @dev set pointEarned with 18 decimal
  function swapToPaymentCoin(address user,uint pointToSwap)public {
     require(onlyApprovedAdmin[msg.sender]==true,"you are not permitted");
        require(_Ipointscoin.balanceOf(user)>= pointToSwap,"not enough points");
        require(pointToSwap >= pointsMin,"points to swap less than minpoints");
        uint amount = checkAmountToRecive(pointToSwap);
        claimedPaymentCoin += amount;
        uint _fee = (amount*withdrawalFee)/100;
        uint amoutAfterFee = amount -_fee;
        _Ipointscoin.burn(user,pointToSwap);
        _Ipaymentcoin.transfer(user,amoutAfterFee);
        _Ipaymentcoin.transfer(msg.sender,_fee);
        emit swap(user,pointToSwap,amoutAfterFee,_fee);
  }



 
}





