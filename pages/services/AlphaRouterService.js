const { AlphaRouter } = require('@uniswap/smart-order-router')
const { Token, CurrencyAmount, TradeType, Percent } = require('@uniswap/sdk-core')
const { ethers, BigNumber } = require('ethers')
const JSBI = require('jsbi')
const ERC20ABI = require('../ABIS/erc20ABI.json');
const { abi: IUniswapV3PoolABI } = require('@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json')
const { abi: SwapRouterABI} = require('@uniswap/v3-periphery/artifacts/contracts/interfaces/ISwapRouter.sol/ISwapRouter.json')


const V3_SWAP_ROUTER_ADDRESS = "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45"
const POOL_ADDRESS="0x90AD1A6363707bdc6a868D529E31b1D0a609D4c2"
const REACT_APP_INFURA_URL_TESTNET = "https://ropsten.infura.io/v3/988dc1afceb64337a0110c0ed2175378"

const chainId = 3

const web3Provider = new ethers.providers.JsonRpcProvider(REACT_APP_INFURA_URL_TESTNET)
const router = new AlphaRouter({ chainId: chainId, provider: web3Provider })

const name0 = 'MOCK_WETH'
const symbol0 = 'M_WETH'
const decimals0 = 18
const address0 = '0x3670e30F30774d1907ca4E672c3bcbeeCf4d4d4d'

const name1 = 'MOCK_DAI'
const symbol1 = 'M_DAI'
const decimals1 = 18
const address1 = '0xdFa64480D635c437b3D72D4caae1A06c88e8a72e'

const WETH = new Token(chainId, address0, decimals0, symbol0, name0)
const DAI = new Token(chainId, address1, decimals1, symbol1, name1)

export const getWethContract = () => new ethers.Contract(address0, ERC20ABI, web3Provider)
export const getDaiContract = () => new ethers.Contract(address1, ERC20ABI, web3Provider)
export const getPoolContract = () => new ethers.Contract(POOL_ADDRESS, IUniswapV3PoolABI, web3Provider)
export const getSwapRouterContract =()=>new ethers.Contract(V3_SWAP_ROUTER_ADDRESS, SwapRouterABI, web3Provider)
export const getPrice = async (inputAmount, slippageAmount, deadline, walletAddress) => {
  const percentSlippage = new Percent(slippageAmount, 100)
  const wei = ethers.utils.parseUnits(inputAmount.toString(), decimals0)
  const currencyAmount = CurrencyAmount.fromRawAmount(WETH, JSBI.BigInt(wei))

  const route = await router.route(
    currencyAmount,
    DAI,
    TradeType.EXACT_INPUT,
    {
      recipient: walletAddress,
      slippageTolerance: percentSlippage,
      deadline: deadline,
    }
  )

  const transaction = {
    data: route.methodParameters.calldata,
    to: V3_SWAP_ROUTER_ADDRESS,
    value: BigNumber.from(route.methodParameters.value).toString(),
    from: walletAddress,
    gasPrice: BigNumber.from(route.gasPriceWei),
    gasLimit: ethers.utils.hexlify(1000000)
  }

  console.log("**@ making tx , transaction is , ",transaction);

  const quoteAmountOut = route.quote.toFixed(6)
  const ratio = (inputAmount / quoteAmountOut).toFixed(10)

  return [
    transaction,
    quoteAmountOut,
    ratio
  ]
}

export const runSwap = async (transaction,signer,amountIn,deadlineInMinutes,walletAddress,amountOutMin) => {

  console.log("**@ runswap called with transaction , ",transaction);
  console.log("**@ signer2 is , ",signer);

  signer.sendTransaction(transaction)

}

