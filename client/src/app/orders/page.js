"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import Alert from "../../../components/ui/Alert";
import Loading from "../../../components/ui/Loading";
import PageHeader from "../../../components/ui/PageHeader";

const ORDERS_URL =
  "https://mocki.io/v1/d3b5b64c-89be-476f-a447-d30b3592dccb";

const formatLabel = (value) =>
  String(value)
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const formatValue = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
};

const getOrderEntries = (order) => {
  if (!order || typeof order !== "object" || Array.isArray(order)) {
    return [["value", order]];
  }

  const entries = Object.entries(order);
  return entries.length ? entries : [["value", "—"]];
};

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        setError("");

        const response = await axios.get(ORDERS_URL);
        const nextOrders = Array.isArray(response.data) ? response.data : [];

        if (active) {
          setOrders(nextOrders);
        }
      } catch (fetchError) {
        if (active) {
          setOrders([]);
          setError("Unable to load orders from the mock API right now.");
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    fetchOrders();

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <PageHeader
        title="Orders"
        subtitle="Previewing mock order data for the new orders route."
      />

      <div className="mt-8 space-y-4">
        {error ? (
          <Alert
            variant="error"
            title="Orders unavailable"
            message={error}
          />
        ) : null}

        {isLoading ? (
          <div className="rounded-2xl border border-[var(--color-border)] bg-[rgba(255,255,255,0.04)] p-6">
            <Loading label="Loading orders..." />
          </div>
        ) : null}

        {!isLoading && !error && !orders.length ? (
          <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[rgba(255,255,255,0.04)] p-6 text-sm text-[var(--color-muted)]">
            No orders available.
          </div>
        ) : null}

        {!isLoading && !error && orders.length ? (
          <div className="grid gap-4">
            {orders.map((order, index) => (
              <section
                key={order?.id ?? order?.orderId ?? `order-${index}`}
                className="rounded-2xl border border-[var(--color-border)] bg-[rgba(8,10,14,0.92)] p-5"
              >
                <div className="flex flex-col gap-2 border-b border-[var(--color-border-alt)] pb-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="font-[var(--font-display)] text-lg font-semibold text-[var(--color-foreground)]">
                      Order {index + 1}
                    </h2>
                    <p className="text-sm text-[var(--color-muted)]">
                      Mock order snapshot
                    </p>
                  </div>
                </div>

                <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                  {getOrderEntries(order).map(([key, value]) => (
                    <div
                      key={`${index}-${key}`}
                      className="rounded-xl border border-[var(--color-border-alt)] bg-[rgba(255,255,255,0.03)] p-3"
                    >
                      <dt className="text-xs uppercase tracking-[0.16em] text-[var(--color-muted)]">
                        {formatLabel(key)}
                      </dt>
                      <dd className="mt-2 whitespace-pre-wrap break-words font-[var(--font-mono)] text-sm text-[var(--color-foreground)]">
                        {formatValue(value)}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            ))}
          </div>
        ) : null}
      </div>
    </main>
  );
}
