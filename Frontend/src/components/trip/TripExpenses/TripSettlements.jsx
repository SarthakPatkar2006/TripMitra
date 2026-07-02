import { useEffect, useState } from "react";
import {
  ArrowRight,
  Wallet,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

import { getSettlements } from "../../../api/financeApi";

import "./TripSettlements.css";

const formatCurrency = (amount = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

export default function TripSettlements({
  tripId,
}) {
  const [loading, setLoading] =
    useState(true);

  const [balances, setBalances] =
    useState([]);

  const [settlements, setSettlements] =
    useState([]);

  const [transactionCount, setTransactionCount] =
    useState(0);

  const [totalCredit, setTotalCredit] =
    useState(0);

  const [totalDebt, setTotalDebt] =
    useState(0);

  const fetchSettlements =
    async () => {
      try {
        setLoading(true);

        const res =
          await getSettlements(
            tripId
          );

        const data =
          res.data;

        setBalances(
          data.balances || []
        );

        setSettlements(
          data.settlements || []
        );

        setTransactionCount(
          data.transactionCount || 0
        );

        setTotalCredit(
          data.totalCredit || 0
        );

        setTotalDebt(
          data.totalDebt || 0
        );
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchSettlements();
  }, [tripId]);

  if (loading) {
    return (
      <div className="settlement-loading">
        Loading settlements...
      </div>
    );
  }

  return (
    <section className="settlement-page">

      {/* Summary */}

      <div className="settlement-summary">

        <div className="settlement-summary-card">

          <Wallet size={24} />

          <div>

            <span>
              Transactions
            </span>

            <strong>
              {transactionCount}
            </strong>

          </div>

        </div>

        <div className="settlement-summary-card positive">

          <CheckCircle2 size={24} />

          <div>

            <span>
              Total Credit
            </span>

            <strong>
              {formatCurrency(
                totalCredit
              )}
            </strong>

          </div>

        </div>

        <div className="settlement-summary-card negative">

          <Wallet size={24} />

          <div>

            <span>
              Total Debt
            </span>

            <strong>
              {formatCurrency(
                totalDebt
              )}
            </strong>

          </div>

        </div>

      </div>

      {/* Balances */}

      <div className="balance-section">

        <div className="section-header">

          <h2>
            Member Balances
          </h2>

          <button
            onClick={
              fetchSettlements
            }
          >
            <RefreshCw size={16} />
            Refresh
          </button>

        </div>

        <div className="balance-grid">

          {balances.map(
            (member) => (
              <div
                key={
                  member.userId
                }
                className="balance-card"
              >

                <div>

                  <h4>
                    {member.name}
                  </h4>

                  <small>
                    {member.email}
                  </small>

                </div>

                <strong
                  className={
                    member.balance >=
                    0
                      ? "positive"
                      : "negative"
                  }
                >
                  {formatCurrency(
                    member.balance
                  )}
                </strong>

              </div>
            )
          )}

        </div>

      </div>

      {/* Settlement List */}

      <div className="settlement-section">

        <div className="section-header">

          <h2>
            Recommended Settlements
          </h2>

        </div>

        {settlements.length ===
        0 ? (
          <div className="settlement-empty">

            <CheckCircle2
              size={60}
            />

            <h3>
              All Settled 🎉
            </h3>

            <p>
              No transactions are
              required.
            </p>

          </div>
        ) : (
          <div className="settlement-list">

            {settlements.map(
              (
                settlement,
                index
              ) => (
                <div
                  key={index}
                  className="settlement-card"
                >

                  <div className="person">

                    <h4>
                      {
                        settlement.fromName
                      }
                    </h4>

                    <small>
                      Pays
                    </small>

                  </div>

                  <ArrowRight
                    size={22}
                  />

                  <div className="person">

                    <h4>
                      {
                        settlement.toName
                      }
                    </h4>

                    <small>
                      Receives
                    </small>

                  </div>

                  <div className="settlement-amount">

                    {formatCurrency(
                      settlement.amount
                    )}

                  </div>

                </div>
              )
            )}

          </div>
        )}

      </div>

    </section>
  );
}