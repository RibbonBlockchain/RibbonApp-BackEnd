// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity 0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

interface IERC20T {
    function decimals()external view returns (uint8);

    function balanceOf(address account) external view returns (uint256);
   
    function transfer(address to, uint256 value) external returns (bool);

    function burn(address account, uint256 value)external;
 
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}

contract vault is Ownable {
  IERC20T _Ipaymentcoin;
  IERC20T _Ipointscoin;
  uint depositFee;
  uint rate;
  uint withdrawalFee;
  uint pointsMin;
  event swap(address user,uint pointToSwap,uint paymentTokenRecieved,uint _fees);
  event PointsClaimed(address user,uint amount); 
  constructor(address owner)Ownable(owner){
       
  }

  // @dev set fee  without decimal 
  function setpaymentTokenAndpoints(address paymentAddress,address pointsaddress)public onlyOwner{
       _Ipaymentcoin = IERC20T(paymentAddress);
       _Ipointscoin = IERC20T(pointsaddress);
  }

  function init()public onlyOwner{
     
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

  function withdrawfees(address feeTakerAddress) public onlyOwner{
       uint contractBalance =_Ipaymentcoin.balanceOf(address(this));
       uint _fee = (contractBalance*depositFee)/100;
       _Ipaymentcoin.transfer(feeTakerAddress,_fee);
  }

  function claimPoints(address user,uint amount)public onlyOwner {
          require(amount >= pointsMin);
          _Ipointscoin.transfer(user,amount);
       emit   PointsClaimed(user,amount);
  }
  
  function checkAmountToRecive(uint pointToSwap)public view returns(uint){
          uint _rate = (pointToSwap * 1*10**_Ipaymentcoin.decimals())/(rate*10**18);
          return _rate;
  }

   // @dev set pointEarned with 18 decimal
  function swapToPaymentCoin(address user,uint pointToSwap)public onlyOwner{
        require(_Ipointscoin.balanceOf(user)>= pointToSwap,"not enough points");
        require(pointToSwap >= pointsMin);
        uint amount = checkAmountToRecive(pointToSwap);
        uint _fee = (amount*withdrawalFee)/100;
        uint amoutAfterFee = amount -_fee;
        _Ipointscoin.burn(user,pointToSwap);
        _Ipaymentcoin.transfer(user,amoutAfterFee);
        _Ipaymentcoin.transfer(msg.sender,_fee);
        emit swap(user,pointToSwap,amoutAfterFee,_fee);
  }
}


