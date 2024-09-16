import React, { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { 
  PublicKey, 
  Transaction, 
  TransactionInstruction,
  SystemProgram,
} from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';
import { Buffer } from 'buffer';

// Replace with your actual program ID
const PROGRAM_ID = new PublicKey('5gmLA2nzhqxTstm5krRbrEWT2VEiDM9QiR6X6osT7aWt');

function Mint() {
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState('');
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  const mintTokens = async () => {
    if (!publicKey) {
      setStatus('Please connect your wallet first.');
      return;
    }

    try {
      setStatus('Preparing transaction...');

      // Replace with your actual mint address
      const mintPubkey = new PublicKey('FVbef7qubfMYFbsWvNVNv3zmebcUPrsPkHeNim4RNc5Y');

      // Get the associated token account for the user
      const associatedTokenAddress = await getAssociatedTokenAddress(
        mintPubkey,
        publicKey
      );

      // Prepare the instruction data
      const amountToMint = window.BigInt(amount);
      const instructionData = Buffer.alloc(8);
      instructionData.writeBigUInt64LE(amountToMint);

      // Create the mint instruction
      const mintInstruction = new TransactionInstruction({
        keys: [
          { pubkey: mintPubkey, isSigner: false, isWritable: true },
          { pubkey: associatedTokenAddress, isSigner: false, isWritable: true },
          { pubkey: publicKey, isSigner: true, isWritable: false },
          { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        ],
        programId: PROGRAM_ID,
        data: instructionData,
      });

      const transaction = new Transaction().add(mintInstruction);

      setStatus('Sending transaction...');
      const signature = await sendTransaction(transaction, connection);
      
      setStatus('Confirming transaction...');
      const confirmation = await connection.confirmTransaction(signature, 'confirmed');

      if (confirmation.value.err) {
        throw new Error('Transaction failed to confirm');
      }

      setStatus(`Tokens minted successfully! Signature: ${signature}`);
    } catch (error) {
      console.error('Error minting tokens:', error);
      setStatus(`Error minting tokens: ${error.message}`);
    }
  };

  return (
    <div>
      <h1>Solana Token Minter</h1>
      <WalletMultiButton />
      <input 
        type="number" 
        value={amount} 
        onChange={(e) => setAmount(e.target.value)} 
        placeholder="Amount to mint"
      />
      <button onClick={mintTokens}>Mint Tokens</button>
      <p>{status}</p>
    </div>
  );
}

export default Mint;