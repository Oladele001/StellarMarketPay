import React, { useState } from 'react';
import QRCode from 'react-qr-code';
import { StellarService } from '@/lib/stellar';

interface CreatePaymentModalProps {
  publicKey: string;
  onClose: () => void;
}

export default function CreatePaymentModal({ publicKey, onClose }: CreatePaymentModalProps) {
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [asset, setAsset] = useState<'XLM' | 'USDC'>('XLM');
  const [isGenerated, setIsGenerated] = useState(false);

  const paymentData = StellarService.generateQRPaymentData({
    destination: publicKey,
    amount: amount || '0',
    asset: asset,
    memo: memo || undefined,
  });

  // A basic wallet link that ecosystem wallets can use
  // We format it as a web+stellar deep link
  const stellarUri = `web+stellar:pay?destination=${publicKey}&amount=${amount}&asset_code=${asset}&memo=${encodeURIComponent(memo)}&memo_type=MEMO_TEXT`;
  
  const shareText = `Pay ${amount} ${asset} to ${customerName ? customerName + "'s" : "my"} StellarMarketPay wallet! %0A%0A📲 Pay here: ${stellarUri}`;
  const whatsappLink = `https://wa.me/?text=${shareText}`;

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return;
    setIsGenerated(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-gray-900 border border-gray-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 flex justify-between items-center border-b border-gray-800 bg-gray-900/50">
          <h3 className="text-xl font-bold text-gray-100">
            {isGenerated ? 'Share Payment' : 'Create Payment'}
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-red-400 transition-colors p-1"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto">
          {!isGenerated ? (
            <form onSubmit={handleGenerate} className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Amount</label>
                  <input
                    type="number"
                    step="0.0000001"
                    min="0"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-all font-mono"
                    placeholder="0.00"
                  />
                </div>
                <div className="w-32">
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Asset</label>
                  <select
                    value={asset}
                    onChange={(e) => setAsset(e.target.value as 'XLM' | 'USDC')}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-all cursor-pointer font-bold"
                  >
                    <option value="XLM">XLM</option>
                    <option value="USDC">USDC (Test)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Customer Name (Optional)</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                  placeholder="e.g. John Doe"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Memo / Description</label>
                <input
                  type="text"
                  required
                  maxLength={28} // Stellar memo text length limit
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                  placeholder="Invoice 1234..."
                />
                <p className="text-xs text-gray-600 mt-1">Maximum 28 characters. This helps verify the payment.</p>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full bg-green-500 hover:bg-green-400 text-gray-950 font-bold px-4 py-3.5 rounded-xl transition-all flex items-center justify-center space-x-2 shadow-lg shadow-green-500/20"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                  <span>Generate QR Code</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="flex flex-col items-center animate-in zoom-in-95 duration-300">
              <div className="bg-white p-4 rounded-3xl shadow-xl mb-6 border-4 border-gray-800">
                <QRCode value={paymentData} size={200} level="H" />
              </div>
              
              <div className="text-center mb-6">
                <h4 className="text-2xl font-bold text-white tracking-tight">{amount} {asset}</h4>
                <p className="text-sm text-gray-400 mt-1">Memo: <span className="text-green-400 font-mono font-medium">{memo}</span></p>
                <div className="inline-flex items-center space-x-2 mt-4 bg-gray-950 px-4 py-2 rounded-full border border-gray-800">
                   <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                   <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Awaiting Payment...</span>
                </div>
              </div>

              <div className="flex space-x-3 w-full">
                <a 
                  href={whatsappLink}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-medium px-4 py-3 rounded-xl transition-colors flex items-center justify-center space-x-2 border border-gray-700"
                >
                  <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                  </svg>
                  <span>Share WA</span>
                </a>
                
                <button 
                  onClick={() => setIsGenerated(false)}
                  className="flex-1 bg-gray-950 hover:bg-gray-800 text-gray-300 font-medium px-4 py-3 rounded-xl transition-colors border border-gray-800"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
