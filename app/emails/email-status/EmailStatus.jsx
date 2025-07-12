"use client";

import React, { useState, useEffect } from "react";
import { Table, Spinner, Button, Form } from "react-bootstrap";

export default function EmailTrackingPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(100);
  const [totalPages, setTotalPages] = useState(1);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [statusCounts, setStatusCounts] = useState({});
  const [selectedBouncedEmails, setSelectedBouncedEmails] = useState([]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/email-status?from=${fromDate}&to=${toDate}&page=${page}&limit=${limit}&status=${statusFilter}`
      );
      const data = await res.json();
      setRecords(data.records || []);
      setTotalPages(Math.ceil(data.total / limit));
      setStatusCounts(data.counts || {});
    } catch (err) {
      console.error("Failed to fetch email records:", err);
      setRecords([]);
      setStatusCounts({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (fromDate && toDate) {
      fetchRecords();
    }
  }, [fromDate, toDate, page, statusFilter]);

  const statusColor = (status) => {
    switch (status) {
      case "Click":
        return "success";
      case "Open":
        return "info";
      case "Delivery":
        return "primary";
      case "Bounce":
        return "danger";
      case "Complaint":
        return "warning";
      default:
        return "secondary";
    }
  };

  const toggleEmailSelection = (email) => {
    setSelectedBouncedEmails((prev) =>
      prev.includes(email)
        ? prev.filter((e) => e !== email)
        : [...prev, email]
    );
  };

  const selectAllBounced = () => {
    const uniqueBouncedEmails = [
      ...new Set(records.filter((r) => r.status === "Bounce").map((r) => r.email)),
    ];
    setSelectedBouncedEmails(uniqueBouncedEmails);
  };

  const markInactive = async () => {
    if (selectedBouncedEmails.length === 0) return alert("No emails selected.");

    try {
      const res = await fetch("/api/admin/mark-inactive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: selectedBouncedEmails }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message || "Selected emails marked as inactive.");
        setSelectedBouncedEmails([]);
        fetchRecords();
      } else {
        alert(data.message || "Failed to mark as inactive.");
      }
    } catch (error) {
      console.error("Error unsubscribing:", error);
      alert("Error occurred while marking emails as inactive.");
    }
  };

  return (
    <div className="container mt-4">
      <h4>📈 Email Event Tracking</h4>

      {/* 🔎 Filters */}
      <div className="row mb-3">
        <div className="col-md-3">
          <Form.Label>From</Form.Label>
          <Form.Control
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>
        <div className="col-md-3">
          <Form.Label>To</Form.Label>
          <Form.Control
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>
        <div className="col-md-3">
          <Form.Label>Status Filter</Form.Label>
          <Form.Select
            value={statusFilter}
            onChange={(e) => {
              setPage(1);
              setStatusFilter(e.target.value);
            }}
          >
            <option value="All">All</option>
            <option value="Delivery">Delivered</option>
            <option value="Open">Opened</option>
            <option value="Click">Clicked</option>
            <option value="Bounce">Bounced</option>
            <option value="Complaint">Complaints</option>
          </Form.Select>
        </div>
        <div className="col-md-3 d-flex align-items-end">
          <Button variant="primary" onClick={fetchRecords} disabled={!fromDate || !toDate}>
            🔍 Filter
          </Button>
        </div>
      </div>

      {/* 📊 Summary Stats */}
      <div className="row mb-4">
        <div className="col-md-12">
          <div className="card shadow-sm">
            <div className="card-body d-flex flex-wrap gap-3 justify-content-start align-items-center">
              <SummaryBadge label="Total Events" value={records.length} color="dark" />
              <SummaryBadge
                label="Unique Emails"
                value={new Set(records.map((r) => r.email)).size}
                color="secondary"
              />
              <SummaryBadge
                label="Total Delivered"
                value={(statusCounts.Delivery || 0) + (statusCounts.Open || 0)}
                color="primary"
              />
              <SummaryBadge label="Delivered (Not Opened)" value={statusCounts.Delivery || 0} color="primary" />
              <SummaryBadge label="Opened" value={statusCounts.Open || 0} color="info" />
              <SummaryBadge label="Clicked" value={statusCounts.Click || 0} color="success" />
              <SummaryBadge label="Bounced" value={statusCounts.Bounce || 0} color="danger" />
              <SummaryBadge label="Complaints" value={statusCounts.Complaint || 0} color="danger" />
            </div>
          </div>
        </div>
      </div>

      {/* 🔘 Bulk Actions */}
      {records.length > 0 && (
        <div className="mb-3 d-flex gap-2">
          <Button variant="warning" onClick={selectAllBounced}>
            🎯 Select All Bounced Emails
          </Button>
          <Button
            variant="danger"
            onClick={markInactive}
            disabled={selectedBouncedEmails.length === 0}
          >
            🚫 Mark Selected as Inactive ({selectedBouncedEmails.length})
          </Button>
        </div>
      )}

      {/* 📋 Table */}
      {loading ? (
        <div className="text-center">
          <Spinner animation="border" />
        </div>
      ) : (
        <>
          <Table striped bordered hover responsive size="sm">
            <thead>
              <tr>
                <th>#</th>
                <th>Email</th>
                <th>Status</th>
                <th>Link</th>
                <th>IP</th>
                <th>User Agent</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {records.map((rec, idx) => {
                const isBounced = rec.status === "Bounce";
                const isChecked = selectedBouncedEmails.includes(rec.email);
                return (
                  <tr key={rec.messageId + idx}>
                    <td>
                      {isBounced && (
                        <Form.Check
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleEmailSelection(rec.email)}
                        />
                      )}{" "}
                      {(page - 1) * limit + idx + 1}
                    </td>
                    <td>{rec.email}</td>
                    <td>
                      <span className={`badge bg-${statusColor(rec.status)}`}>
                        {rec.status}
                      </span>
                    </td>
                    <td style={{ maxWidth: "200px", overflowWrap: "break-word" }}>
                      {rec.link || "-"}
                    </td>
                    <td>{rec.ip || "-"}</td>
                    <td style={{ maxWidth: "200px", overflowWrap: "break-word" }}>
                      {rec.userAgent || "-"}</td>
                    <td>{new Date(rec.eventTime).toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </Table>

          {/* 🔁 Pagination */}
          <div className="d-flex justify-content-between align-items-center">
            <Button
              variant="outline-secondary"
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
            >
              ← Prev
            </Button>
            <span>
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline-secondary"
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
            >
              Next →
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

// ✅ Reusable summary badge
function SummaryBadge({ label, value, color = "secondary" }) {
  return (
    <span className={`badge bg-${color} fs-6`}>
      {label}: <strong>{value}</strong>
    </span>
  );
}
