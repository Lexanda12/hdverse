import { useState, useEffect } from 'react';
import { apiClient } from '../lib/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { 
  Loader2, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Wallet, 
  CheckCircle2, 
  AlertTriangle, 
  X
} from 'lucide-react';

interface Transaction {
  id: string;
  type: string;
  direction: 'CREDIT' | 'DEBIT';
  amount: number;
  currency: string;
  description: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  createdAt: string;
}

interface Bank {
  name: string;
  code: string;
}

export default function WalletPage() {
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Payout Modal State
  const [showModal, setShowModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState<number | ''>('');
  const [selectedBankCode, setSelectedBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [isVerifyingAccount, setIsVerifyingAccount] = useState(false);
  const [isAccountVerified, setIsAccountVerified] = useState(false);
  const [modalError, setModalError] = useState('');
  const [isSubmittingPayout, setIsSubmittingPayout] = useState(false);
  const [payoutSuccess, setPayoutSuccess] = useState(false);

  const loadData = async () => {
    try {
      const walletRes = await apiClient.get('/wallet');
      setBalance(walletRes.data.data.balance);
      setTransactions(walletRes.data.data.transactions);
      
      const banksRes = await apiClient.get('/wallet/banks');
      setBanks(banksRes.data.data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to fetch wallet info.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleVerifyAccount = async () => {
    if (accountNumber.length !== 10) {
      setModalError('Account number must be 10 digits.');
      return;
    }
    if (!selectedBankCode) {
      setModalError('Please select a bank.');
      return;
    }

    setIsVerifyingAccount(true);
    setModalError('');
    setAccountName('');
    setIsAccountVerified(false);

    try {
      const res = await apiClient.get(
        `/wallet/resolve-account?accountNumber=${accountNumber}&bankCode=${selectedBankCode}`
      );
      setAccountName(res.data.data.accountName);
      setIsAccountVerified(true);
    } catch (err: any) {
      setModalError(
        err.response?.data?.error?.message || 
        'Could not verify account name. Please check your inputs.'
      );
    } finally {
      setIsVerifyingAccount(false);
    }
  };

  const handlePayoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payoutAmount || payoutAmount < 1000) {
      setModalError('Minimum payout is ₦1,000.');
      return;
    }
    if (payoutAmount > balance) {
      setModalError('Insufficient balance.');
      return;
    }
    if (!isAccountVerified) {
      setModalError('Please verify your account details first.');
      return;
    }

    setIsSubmittingPayout(true);
    setModalError('');

    try {
      await apiClient.post('/wallet/payout', {
        amount: Number(payoutAmount),
        bankCode: selectedBankCode,
        accountNumber,
        accountName
      });
      
      setPayoutSuccess(true);
      // Reload wallet details in background
      loadData();
      setTimeout(() => {
        setShowModal(false);
        setPayoutSuccess(false);
        setPayoutAmount('');
        setAccountNumber('');
        setSelectedBankCode('');
        setAccountName('');
        setIsAccountVerified(false);
      }, 3000);
    } catch (err: any) {
      setModalError(err.response?.data?.error?.message || 'Payout request failed.');
    } finally {
      setIsSubmittingPayout(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-verse-magenta animate-spin mb-4" />
        <p className="text-verse-muted">Loading wallet...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 font-body space-y-8">
      
      {/* Header */}
      <div>
        <h1 className="font-display text-[32px] font-bold text-white leading-tight">
          Wallet
        </h1>
        <p className="text-verse-slate mt-1 text-sm">
          Track your IP revenues, certificate commissions, and request bank payouts.
        </p>
      </div>

      {error && (
        <div className="bg-verse-error/10 border border-verse-error/20 text-verse-error p-4 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Balance Card */}
      <div className="bg-gradient-to-r from-verse-magenta/10 via-verse-charcoal to-verse-charcoal rounded-[20px] border border-white/5 p-8 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <Wallet className="w-48 h-48 text-white" />
        </div>

        <div className="space-y-1 relative z-10">
          <span className="text-xs font-semibold text-verse-muted uppercase tracking-wider block">
            Available Balance
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-white">
            ₦{balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h2>
        </div>

        <div className="relative z-10">
          <Button 
            variant="primary"
            onClick={() => {
              setShowModal(true);
              setModalError('');
            }}
            disabled={balance < 1000}
            title={balance < 1000 ? 'Minimum balance required to request payout is ₦1,000' : ''}
          >
            Request Payout
          </Button>
        </div>
      </div>

      {/* Transaction History Section */}
      <div className="bg-verse-charcoal border border-white/5 rounded-[20px] p-6 shadow-md">
        <h3 className="font-display text-lg font-bold text-white mb-6 border-b border-white/5 pb-3">
          Transaction Ledger
        </h3>

        {transactions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-verse-muted">
              No transactions yet. Register your first work to earn.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-xs text-verse-muted uppercase tracking-wider">
                  <th className="pb-3 font-semibold">Description</th>
                  <th className="pb-3 font-semibold text-right">Amount</th>
                  <th className="pb-3 font-semibold text-center">Status</th>
                  <th className="pb-3 font-semibold text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-verse-elevated/20 transition-colors">
                    <td className="py-4 pr-4">
                      <div>
                        <p className="font-medium text-white">{tx.description}</p>
                        <p className="text-[11px] text-verse-muted uppercase font-semibold mt-0.5">
                          {tx.type}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 text-right pr-4">
                      <span className={`font-bold flex items-center justify-end gap-1 ${
                        tx.direction === 'CREDIT' ? 'text-verse-teal' : 'text-verse-error'
                      }`}>
                        {tx.direction === 'CREDIT' ? (
                          <>
                            <ArrowDownLeft className="w-3.5 h-3.5" />
                            +₦{tx.amount.toLocaleString()}
                          </>
                        ) : (
                          <>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            -₦{tx.amount.toLocaleString()}
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-4 text-center">
                      <span className={`inline-flex items-center text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        tx.status === 'SUCCESS'
                          ? 'bg-verse-teal/10 text-verse-teal'
                          : tx.status === 'PENDING'
                          ? 'bg-verse-orange/10 text-verse-orange'
                          : 'bg-verse-error/10 text-verse-error'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="py-4 text-right text-xs text-verse-muted">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payout Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-verse-charcoal border border-white/5 rounded-[20px] w-full max-w-[450px] overflow-hidden shadow-2xl relative">
            <button 
              className="absolute top-4 right-4 text-verse-slate hover:text-white transition-colors"
              onClick={() => setShowModal(false)}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-6 md:p-8 space-y-6">
              <div className="text-center">
                <Wallet className="w-10 h-10 text-verse-magenta mx-auto mb-2" />
                <h3 className="font-display text-xl font-bold text-white">Request Payout</h3>
                <p className="text-xs text-verse-muted mt-1">
                  Withdraw funds directly to your Nigerian bank account.
                </p>
              </div>

              {payoutSuccess ? (
                <div className="text-center py-6 space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-verse-teal mx-auto animate-bounce" />
                  <h4 className="text-base font-semibold text-white">Payout Requested Successfully</h4>
                  <p className="text-xs text-verse-muted">
                    Funds are processing and typically arrive in 1-2 business days.
                  </p>
                </div>
              ) : (
                <form onSubmit={handlePayoutSubmit} className="space-y-4">
                  {modalError && (
                    <div className="bg-verse-error/10 border border-verse-error/20 text-verse-error p-3 rounded-md text-xs">
                      {modalError}
                    </div>
                  )}

                  {/* Amount input */}
                  <div>
                    <Input 
                      type="number"
                      label="Amount (₦)"
                      placeholder="Min ₦1,000"
                      min={1000}
                      value={payoutAmount}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setPayoutAmount(isNaN(val) ? '' : val);
                        setModalError('');
                      }}
                      required
                    />
                    <span className="text-[10px] text-verse-muted mt-1 block">
                      Max available: ₦{balance.toLocaleString()}
                    </span>
                  </div>

                  {/* Bank list selector */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-verse-slate">
                      Select Bank
                    </label>
                    <select
                      className="w-full px-4 py-3 rounded-md text-sm text-white bg-verse-elevated border border-verse-elevated focus:outline-none focus:border-verse-magenta"
                      value={selectedBankCode}
                      onChange={(e) => {
                        setSelectedBankCode(e.target.value);
                        setIsAccountVerified(false);
                        setAccountName('');
                        setModalError('');
                      }}
                      required
                    >
                      <option value="">-- Choose a Bank --</option>
                      {banks.map((bank) => (
                        <option key={bank.code} value={bank.code}>
                          {bank.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Account number */}
                  <div className="flex items-end gap-2">
                    <div className="flex-grow">
                      <Input 
                        type="text"
                        label="Account Number"
                        placeholder="10 Digits NUBAN"
                        maxLength={10}
                        value={accountNumber}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          setAccountNumber(val);
                          setIsAccountVerified(false);
                          setAccountName('');
                          setModalError('');
                        }}
                        required
                      />
                    </div>
                    
                    <Button
                      type="button"
                      variant="secondary"
                      className="py-[11px]"
                      onClick={handleVerifyAccount}
                      loading={isVerifyingAccount}
                      disabled={accountNumber.length !== 10 || !selectedBankCode}
                    >
                      Verify
                    </Button>
                  </div>

                  {/* Verified account name container */}
                  {isAccountVerified && (
                    <div className="bg-verse-teal/5 border border-verse-teal/10 rounded-md p-3">
                      <span className="text-[10px] text-verse-teal uppercase font-bold tracking-wider block">
                        Account Verified ✓
                      </span>
                      <span className="text-xs text-white font-medium block mt-0.5">
                        {accountName}
                      </span>
                    </div>
                  )}

                  <div className="bg-verse-elevated/40 border border-white/5 rounded-md p-3 flex gap-2">
                    <AlertTriangle className="w-4 h-4 text-verse-yellow flex-shrink-0 mt-0.5" />
                    <p className="text-[10px] text-verse-slate leading-relaxed">
                      Funds arrive in 1-2 business days. Payouts are made exclusively using official Paystack Transfer networks.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-full mt-2"
                    loading={isSubmittingPayout}
                    disabled={!isAccountVerified || isSubmittingPayout || !payoutAmount || payoutAmount > balance}
                  >
                    Confirm Payout
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
