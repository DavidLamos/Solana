import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaSync } from 'react-icons/fa';
import Dropdown from './Dropdown';
import AmountInput from './AmountInput';
import SwapButton from './SwapButton';
import Slippage from './Slippage';
import PriceDisplay from './PriceDisplay';
import SlippageModal from './SlippageModal';
import fetch from 'cross-fetch';
import { Connection, Keypair, VersionedTransaction } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
import { TOKEN_PROGRAM_ID, getAccount } from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';
import '../styles/token-swap.css';
import OpenLinkButton from './OpenLink';
const TokenSwap = () => {
  const [isLink, setLink] = useState(false);
  const [decimals, setDecimals] = useState(null);
  const [swaplamports, setLamports] = useState(0);
  console.log("this is swapllamports", swaplamports)
  const fetchTokenDecimals = async (address) => {
    try {
      const response = await fetch('https://mainnet.helius-rpc.com/?api-key=a5325979-a571-4de7-bcfe-1a6dfe8dc0c4', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getTokenSupply',
          params: [address],
        }),
      });

      const data = await response.json();

      if (data.result && data.result.value && data.result.value.decimals !== undefined) {
        setDecimals(data.result.value.decimals);
        setLamports((10 ** data.result.value.decimals) * fromAmount);
      } else {
        console.error('Error fetching token decimals:', data);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    }
  };
  
  const [txid, setTxid] = useState('2QXp9xgXb8s4wKdquiEdpLo3epp6ZuRsdHFzqycP56jkAa9H8kd8zaRdaE9b1TcAuJfieaTT4iTr7DLWZbjaeB9z');
  const { publicKey, signTransaction } = useWallet();
  const handleSwap1 = async () => {
    console.log(tokens.includes('SOL'),"tokens")
    const fromTokenItem = tokens.find(item=>item.symbol === fromToken)
    const toTokenItem = tokens.find(item=>item.symbol === toToken)
    fetchTokenDecimals(fromTokenItem.address);
    console.log(fromTokenItem,"ei",toTokenItem, swaplamports)
    if (!publicKey) {
        console.error('Wallet not connected');
        return;
    }
    console.log('wallet address:', publicKey.toString());
    try {
    const connection = new Connection('https://mainnet.helius-rpc.com/?api-key=a5325979-a571-4de7-bcfe-1a6dfe8dc0c4',"confirmed");
    const quoteResponse = await fetch(`https://quote-api.jup.ag/v6/quote?inputMint=${fromTokenItem.address}&outputMint=${toTokenItem.address}&amount=${swaplamports}&slippageBps=50`)
    .then(res => res.json());
    console.log('1');
    const { swapTransaction } = await fetch('https://quote-api.jup.ag/v6/swap', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        quoteResponse,
        userPublicKey: publicKey.toString(),
        wrapAndUnwrapSol: true,
    })
    }).then(res => res.json());
    console.log('2');
    const swapTransactionBuf = Buffer.from(swapTransaction, 'base64');
    let transaction = VersionedTransaction.deserialize(swapTransactionBuf);

    //   if (signTransaction) {
    const vTxn = await signTransaction(transaction);

    const simulationResult = await connection.simulateTransaction(vTxn, {
    commitment: "processed",
    });

    if (simulationResult.value.err) {
    console.error(
        "* Simulation error",
        simulationResult.value.err,
        simulationResult
    );
    } else {
    console.log("- Simulation success for transaction.");
    }
    const rawTransaction = vTxn.serialize();
    const txid = await connection.sendRawTransaction(rawTransaction, {
    skipPreflight: true,
    maxRetries: 2
    });
    await connection.confirmTransaction(txid);
        setTxid(txid);
        setLink(true)
        console.log(`https://solscan.io/tx/${txid}`);
        window.open(`https://solscan.io/tx/${txid}`, '_blank', 'noopener,noreferrer');

    } catch (error) {
      console.error('Swap failed:', error);
    }
  };

  const [tokens, setTokens] = useState([]);
  const [fromToken, setFromToken] = useState('SOL');
  const [toToken, setToToken] = useState('USDC');
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [showFromDropdown, setShowFromDropdown] = useState(false);
  const [showToDropdown, setShowToDropdown] = useState(false);
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [transactionStatus, setTransactionStatus] = useState('');
  const [slippage, setSlippage] = useState(0.5); // default slippage tolerance
  const [isSlippageModalOpen, setIsSlippageModalOpen] = useState(false);

  const API_BASE_URL = 'https://rational-killdeer-thoroughly.ngrok-free.app';

  useEffect(() => {
    const fetchTokens = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/tokens`,{
          headers: {
            'ngrok-skip-browser-warning': 'true' // or any value you prefer
          }
        });
        console.log('Tokens API response:', response.data);

        // Check if the response is an array or object
        const tokenData = Array.isArray(response.data) ? response.data : response.data.tokens;
        
        if (!Array.isArray(tokenData)) {
          throw new Error('Expected an array of tokens but received something else');
        }

        setTokens(tokenData);
      } catch (error) {
        console.error('Error fetching tokens:', error);
        setError('Failed to fetch tokens');
      }
    };

    fetchTokens();
  }, [API_BASE_URL]);

  const fetchPrices = async (tokenIds) => {
    setLoading(true);
    setError(null);
    try {
      const jupiterResponse = await axios.get(`https://price.jup.ag/v6/price?ids=${tokenIds.join(',')},{
          headers: {
            'ngrok-skip-browser-warning': 'true' // or any value you prefer
          }
        }`);
      console.log('Jupiter Response:', jupiterResponse.data);

      const jupiterPrices = Object.keys(jupiterResponse.data.data).reduce((acc, key) => {
        acc[jupiterResponse.data.data[key].mintSymbol] = jupiterResponse.data.data[key].price;
        return acc;
      }, {});

      console.log('Jupiter Prices:', jupiterPrices);
      setPrices(jupiterPrices);
    } catch (error) {
      console.error('Error fetching prices from Jupiter API:', error);
      setError('Failed to fetch prices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (fromToken && toToken) {
      fetchPrices([fromToken, toToken]);
    }
  }, [fromToken, toToken]);

  useEffect(() => {
    if (fromAmount && prices[fromToken] && prices[toToken]) {
      const fromPrice = prices[fromToken];
      const toPrice = prices[toToken];
      const convertedAmount = (fromAmount * fromPrice / toPrice).toFixed(10);
      setToAmount(convertedAmount);
    } else {
      setToAmount('');
    }
  }, [fromAmount, prices, fromToken, toToken]);

  const handleSelectToken = (token, type) => {
    if (type === 'from') {
      setFromToken(token);
    } else {
      setToToken(token);
    }
    setShowFromDropdown(false);
    setShowToDropdown(false);
    console.log(`Selected ${type} Token:`, token);
  };

  const handleFlip = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
  };

  const handleSwap = async () => {
    handleSwap1()
    setTransactionStatus('Initiating transaction...');
    try {
      const res = await axios.post(`${API_BASE_URL}/api/swap`, {
        fromToken,
        toToken,
        fromAmount,
        toAmount,
        slippage
      });

      console.log("swap - ", res);
      setTransactionStatus('Transaction successful1!');
    } catch (error) {
      console.error('Error during transaction:', error);
      setTransactionStatus('Transaction failed. Please try again.');
    }
  };

  const handleRefresh = () => {
    if (fromToken && toToken) {
      fetchPrices([fromToken, toToken]);
    }
  };

  return (
    <div className="token-swap-container">
      <div className="header">
        <FaSync className="refresh-icon" onClick={handleRefresh} />
        <Slippage slippage={slippage} setIsSlippageModalOpen={setIsSlippageModalOpen} />
        <OpenLinkButton url={`https://solscan.io/tx/${txid}`} text= "Open Transaction" 
          setLink={setLink}
          open={isLink}
        />
      </div>
      <div className="token-swap">
        {loading && <p>Loading...</p>}
        {error && <p className="error">{error}</p>}
        {transactionStatus && <p>{transactionStatus}</p>}
        <div className="token-swap-inputs">
          <div className="token-swap-input">
            <label>From:</label>
            <div className="input-group">
              <Dropdown
                tokens={tokens}
                selectedToken={fromToken}
                onSelectToken={(token) => handleSelectToken(token, 'from')}
                showDropdown={showFromDropdown}
                setShowDropdown={setShowFromDropdown}
              />
              <AmountInput
                value={fromAmount}
                onChange={(e) => setFromAmount(e.target.value)}
                placeholder="Amount"
              />
            </div>
          </div>
          <div className="flip-button-container">
            <SwapButton onClick={handleFlip} />
          </div>
          <div className="token-swap-input">
            <label>To:</label>
            <div className="input-group">
              <Dropdown
                tokens={tokens}
                selectedToken={toToken}
                onSelectToken={(token) => handleSelectToken(token, 'to')}
                showDropdown={showToDropdown}
                setShowDropdown={setShowToDropdown}
              />
              <AmountInput
                value={toAmount}
                readOnly
                placeholder="Amount"
              />
            </div>
          </div>
        </div>
        <button onClick={handleSwap}>Swap</button>
        <SlippageModal
          isOpen={isSlippageModalOpen}
          onRequestClose={() => setIsSlippageModalOpen(false)}
          slippage={slippage}
          setSlippage={setSlippage}
        />
        <PriceDisplay fromToken={fromToken} toToken={toToken} prices={prices} />
      </div>
    </div>
  );
};

export default TokenSwap;
