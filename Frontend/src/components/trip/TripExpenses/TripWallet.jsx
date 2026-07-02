import { useEffect, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  TrendingUp,
  Loader2,
  CheckCircle2,
} from "lucide-react";

import { getWallet } from "../../../api/financeApi";
import "./TripWallet.css";

export default function TripWallet({ tripId }) {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWallet();
  }, [tripId]);

  const fetchWallet = async () => {
    try {
      setLoading(true);

      const res = await getWallet(tripId);

      setWallet(res.data.wallet);
    } catch (err) {
      console.error("Wallet Error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="wallet-loading">
        <Loader2 className="wallet-spinner" size={32} />
        <p>Loading wallet...</p>
      </div>
    );
  }

  if (!wallet) {
    return (
      <div className="wallet-empty">
        Unable to load wallet.
      </div>
    );
  }

  const {
    receivable = [],
    payable = [],
    totalReceivable = 0,
    totalPayable = 0,
    netBalance = 0,
  } = wallet;

  return (
    <div className="wallet-page">

      {/* Header */}

      <div className="wallet-header">

        <div>

          <h2>
            <Wallet size={28} />
            My Wallet
          </h2>

          <p>
            View your personal balances and
            pending settlements.
          </p>

        </div>

      </div>

      {/* Net Balance */}

      <section className="wallet-summary">

        <div className="wallet-balance-card">

          <span className="wallet-label">
            Net Balance
          </span>

          <h1
            className={
              netBalance >= 0
                ? "wallet-positive"
                : "wallet-negative"
            }
          >
            {netBalance >= 0 ? "+" : "-"}₹
            {Math.abs(netBalance)}
          </h1>

          <p>
            {netBalance > 0
              ? "You will receive more than you owe."
              : netBalance < 0
              ? "You need to settle your dues."
              : "Everything is settled."}
          </p>

        </div>

        <div className="wallet-mini-cards">

          <div className="wallet-mini receive-card">

            <TrendingUp size={22} />

            <span>
              Total Receivable
            </span>

            <h3>
              ₹{totalReceivable}
            </h3>

          </div>

          <div className="wallet-mini pay-card">

            <ArrowUpRight size={22} />

            <span>
              Total Payable
            </span>

            <h3>
              ₹{totalPayable}
            </h3>

          </div>

        </div>

      </section>

      {/* Lists */}

      <div className="wallet-grid">

        {/* Receive */}

        <section className="wallet-card">

          <div className="wallet-card-header">

            <ArrowDownLeft
              className="receive-icon"
              size={20}
            />

            <h3>
              Money To Receive
            </h3>

          </div>

          {receivable.length === 0 ? (

            <div className="wallet-placeholder">

              <CheckCircle2 size={40} />

              <p>
                Nobody owes you money.
              </p>

            </div>

          ) : (

            <div className="wallet-list">

              {receivable.map((item, index) => (

                <div
                  className="wallet-item"
                  key={index}
                >

                  <div>

                    <h4>
  {item.user.name}
</h4>

                    <small>
                      Will pay you
                    </small>

                  </div>

                  <span className="wallet-amount receive">
                    ₹{item.amount}
                  </span>

                </div>

              ))}

            </div>

          )}

        </section>

        {/* Pay */}

        <section className="wallet-card">

          <div className="wallet-card-header">

            <ArrowUpRight
              className="pay-icon"
              size={20}
            />

            <h3>
              Money To Pay
            </h3>

          </div>

          {payable.length === 0 ? (

            <div className="wallet-placeholder">

              <CheckCircle2 size={40} />

              <p>
                You don't owe anyone.
              </p>

            </div>

          ) : (

            <div className="wallet-list">

              {payable.map((item, index) => (

                <div
                  className="wallet-item"
                  key={index}
                >

                  <div>

                  <h4>
  {item.user.name}
</h4>
                    <small>
                      You need to pay
                    </small>

                  </div>

                  <span className="wallet-amount pay">
                    ₹{item.amount}
                  </span>

                </div>

              ))}

            </div>

          )}

        </section>

      </div>

    </div>
  );
}